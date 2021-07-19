//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {
  'use strict';

  exports.runU3DTest = () => {
    const input_path = '../../TestFiles/';

    const create3DAnnotation = async (doc, annots) => {
      // ---------------------------------------------------------------------------------
      // Create a 3D annotation based on U3D content. PDF 1.6 introduces the capability 
      // for collections of three-dimensional objects, such as those used by CAD software, 
      // to be embedded in PDF files.
      const link_3D = await doc.createIndirectDict();
      link_3D.putName('Subtype', '3D');

      // Annotation location on the page
      const link_3D_rect = await PDFNet.Rect.init(25, 180, 585, 643);
      link_3D.putRect('Rect', link_3D_rect.x1, link_3D_rect.y1,
        link_3D_rect.x2, link_3D_rect.y2);
      annots.pushBack(link_3D);

      // The 3DA entry is an activation dictionary (see Table 9.34 in the PDF Reference Manual) 
      // that determines how the state of the annotation and its associated artwork can change.
      const activation_dict_3D = await link_3D.putDict('3DA');

      // Set the annotation so that it is activated as soon as the page containing the 
      // annotation is opened. Other options are: PV (page view) and XA (explicit) activation.
      activation_dict_3D.putName('A', 'PO');

      // Embed U3D Streams (3D Model/Artwork).
      const u3d_file = await PDFNet.Filter.createMappedFileFromUString(input_path + 'dice.u3d');
      const u3d_reader = await PDFNet.FilterReader.create(u3d_file);

      // To embed 3D stream without compression, you can omit the second parameter in CreateIndirectStream.
      const flateEncode = await PDFNet.Filter.createFlateEncode();
      const u3d_data_dict = await doc.createIndirectStreamFromFilter(u3d_reader, flateEncode);
      u3d_data_dict.putName('Subtype', 'U3D');
      link_3D.put('3DD', u3d_data_dict);

      // Set the initial view of the 3D artwork that should be used when the annotation is activated.
      const view3D_dict = await link_3D.putDict('3DV');
      view3D_dict.putString('IN', 'Unnamed');
      view3D_dict.putString('XN', 'Default');
      view3D_dict.putName('MS', 'M');
      view3D_dict.putNumber('CO', 27.5);

      // A 12-element 3D transformation matrix that specifies a position and orientation 
      // of the camera in world coordinates.
      const tr3d = await view3D_dict.putArray('C2W');
      tr3d.pushBackNumber(1); tr3d.pushBackNumber(0); tr3d.pushBackNumber(0);
      tr3d.pushBackNumber(0); tr3d.pushBackNumber(0); tr3d.pushBackNumber(-1);
      tr3d.pushBackNumber(0); tr3d.pushBackNumber(1); tr3d.pushBackNumber(0);
      tr3d.pushBackNumber(0); tr3d.pushBackNumber(-27.5); tr3d.pushBackNumber(0);

      // Create annotation appearance stream, a thumbnail which is used during printing or
      // in PDF processors that do not understand 3D data.
      const ap_dict = await link_3D.putDict('AP');

      const builder = await PDFNet.ElementBuilder.create();
      const writer = await PDFNet.ElementWriter.create();

      writer.begin(doc);

      const thumb_pathname = input_path + 'dice.jpg';
      const image = await PDFNet.Image.createFromFile(doc, thumb_pathname);
      writer.writePlacedElement(await builder.createImageScaled(image, 0.0, 0.0, await link_3D_rect.width(), await link_3D_rect.height()));

      const normal_ap_stream = await writer.end();
      normal_ap_stream.putName('Subtype', 'Form');
      normal_ap_stream.putRect('BBox', 0, 0, await link_3D_rect.width(), await link_3D_rect.height());
      ap_dict.put('N', normal_ap_stream);
    }

    const main = async () => {
      const output_path = '../../TestFiles/Output/';

      try {
        const doc = await PDFNet.PDFDoc.create();
        const page = await doc.pageCreate();
        doc.pagePushBack(page);
        const annots = await doc.createIndirectArray();
        page.getSDFObj().then(sdf => sdf.put('Annots', annots));

        await create3DAnnotation(doc, annots);
        doc.save(output_path + 'dice_u3d.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);
        console.log('Done');
      } catch (err) {
        console.log(err);
      }
    }
    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function(error) {
      console.log('Error: ' + JSON.stringify(error));
    }).then(function(){ PDFNet.shutdown(); });
  };
  exports.runU3DTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=U3DTest.js