//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------


// This sample project illustrates how to recompress bi-tonal images in an 
// existing PDF document using JBIG2 compression. The sample is not intended 
// to be a generic PDF optimization tool.
//
// You can download the entire document using the following link:
//   http://www.pdftron.com/net/samplecode/data/US061222892.pdf
//

const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {
  'use strict';

  exports.runJBIG2Test = () => {
    const main = async () => {
      try {
        const pdf_doc = await PDFNet.PDFDoc.createFromFilePath('../../TestFiles/US061222892-a.pdf');
        pdf_doc.initSecurityHandler();

        const cos_doc = await pdf_doc.getSDFDoc();
        const num_objs = await cos_doc.xRefSize();
        for (let i = 1; i < num_objs; ++i) {
          const obj = await cos_doc.getObj(i);
          if (obj && !(await obj.isFree()) && await obj.isStream()) {
            // Process only images
            var itr = await obj.find('Subtype');
            if (!(await itr.hasNext()) || await (await itr.value()).getName() !== 'Image')
              continue;
            const input_image = await PDFNet.Image.createFromObj(obj);
            // Process only gray-scale images
            if (await input_image.getComponentNum() != 1)
              continue;
            if (await input_image.getBitsPerComponent() != 1) // Recompress only 1 BPC images
              continue;

            // Skip images that are already compressed using JBIG2
            itr = await obj.find('Filter');
            if (await itr.hasNext()) {
              const value = await itr.value();
              if (await value.isName() && await value.getName() === 'JBIG2Decode') continue;
            }

            const filter = await obj.getDecodedStream();
            const reader = await PDFNet.FilterReader.create(filter);

            const hint_set = await PDFNet.ObjSet.create();
            const hint = await hint_set.createArray();

            hint.pushBackName('JBIG2');
            hint.pushBackName('Lossless');

            const new_image = await PDFNet.Image.createFromStream(cos_doc, reader, await input_image.getImageWidth(),
              await input_image.getImageHeight(), 1, await PDFNet.ColorSpace.createDeviceGray(), hint);

            const new_img_obj = await new_image.getSDFObj();
            itr = await obj.find('Decode');
            if (await itr.hasNext())
              new_img_obj.put('Decode', await itr.value());
            itr = await obj.find('ImageMask');
            if (await itr.hasNext())
              new_img_obj.put('ImageMask', await itr.value());
            itr = await obj.find('Mask');
            if (await itr.hasNext())
              new_img_obj.put('Mask', await itr.value());

            await cos_doc.swap(i, await new_img_obj.getObjNum());
          }
        }

        pdf_doc.save('../../TestFiles/Output/US061222892_JBIG2.pdf', PDFNet.SDFDoc.SaveOptions.e_remove_unused);
      } catch (err) {
        console.log(err);
      }
    };
    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function(error) {
      console.log('Error: ' + JSON.stringify(error));
    }).then(function(){ PDFNet.shutdown(); });
  };
  exports.runJBIG2Test();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=JBIG2Test.js