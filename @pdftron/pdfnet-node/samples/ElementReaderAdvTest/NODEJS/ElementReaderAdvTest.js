//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------


const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {

  exports.runElementReaderAdvTest = () => {

    const processPath = async (reader, path) => {
      if (await path.isClippingPath()) {
        console.log('This is a clipping path');
      }

      const d = await path.getPathData();

      const opr = d.operators;
      const opr_len = opr.byteLength;
      const data = d.points;
      let data_idx = 0, data_len = data.byteLength / data.BYTES_PER_ELEMENT;

      let x1, y1, x2, y2, x3, y3;

      // Use path.GetCTM() if you are interested in CTM (current transformation matrix).

      let path_str = ' Path Data Points := "';
      for (let opr_idx = 0; opr_idx < opr_len; ++opr_idx) {
        switch (opr[opr_idx]) {
          case PDFNet.Element.PathSegmentType.e_moveto:
            x1 = data[data_idx]; ++data_idx;
            y1 = data[data_idx]; ++data_idx;
            path_str += 'M' + Math.round(x1) + ' ' + Math.round(y1);
            break;
          case PDFNet.Element.PathSegmentType.e_lineto:
            x1 = data[data_idx]; ++data_idx;
            y1 = data[data_idx]; ++data_idx;
            path_str += 'L' + Math.round(x1) + ' ' + Math.round(y1);
            break;
          case PDFNet.Element.PathSegmentType.e_cubicto:
            x1 = data[data_idx]; ++data_idx;
            y1 = data[data_idx]; ++data_idx;
            x2 = data[data_idx]; ++data_idx;
            y2 = data[data_idx]; ++data_idx;
            x3 = data[data_idx]; ++data_idx;
            y3 = data[data_idx]; ++data_idx;
            path_str += 'C' + Math.round(x1) + ' ' + Math.round(y1) + ' ' + Math.round(x2)
             + ' ' + Math.round(y2) + ' ' + Math.round(x3) + ' ' + Math.round(y3);
            break;
          case PDFNet.Element.PathSegmentType.e_rect:
            x1 = data[data_idx]; ++data_idx;
            y1 = data[data_idx]; ++data_idx;
            const w = data[data_idx]; ++data_idx;
            const h = data[data_idx]; ++data_idx;
            x2 = x1 + w;
            y2 = y1;
            x3 = x2;
            y3 = y1 + h;
            const x4 = x1;
            const y4 = y3;
            path_str += 'M' + Math.round(x1) + ' ' + Math.round(y1) + ' L' + Math.round(x2) + ' ' + Math.round(y2)
             + ' L' + Math.round(x3) + ' ' + Math.round(y3) + ' L' + Math.round(x4) + ' ' + Math.round(y4) + ' Z';
            break;
          case PDFNet.Element.PathSegmentType.e_closepath:
            path_str += ' Close Path\n';
            break;
          default:
            throw ''
            break;
        }
      }

      path_str += '" ';

      const gs = await path.getGState();

      // Set Path State 0 (stroke, fill, fill-rule) -----------------------------------
      if (await path.isStroked()) {
        console.log(path_str + 'Stroke path');
        path_str = '';

        if (await (await gs.getStrokeColorSpace()).getType() === PDFNet.ColorSpace.Type.e_pattern) {
          console.log('Path has associated pattern');
        } else {
          // Get stroke color (you can use PDFNet color conversion facilities)
          // ColorPt rgb;
          // gs.GetStrokeColorSpace().Convert2RGB(gs.GetStrokeColor(), rgb);
        }
      } else {
        // Do not stroke path
      }

      if (await path.isFilled()) {
        console.log(path_str + 'Fill path');
        path_str = '';

        if (await (await gs.getFillColorSpace()).getType() === PDFNet.ColorSpace.Type.e_pattern) {
          console.log('Path has associated pattern');
        } else {
          // ColorPt rgb;
          // gs.GetFillColorSpace().Convert2RGB(gs.GetFillColor(), rgb);
        }
      } else {
        // Do not fill path
      }

      if (path_str) {
        console.log(path_str);
      }

      // Process any changes in graphics state  ---------------------------------

      const gs_itr = await reader.getChangesIterator();
      for (; await gs_itr.hasNext(); await gs_itr.next()) {
        switch (await gs_itr.current()) {
          case PDFNet.GState.Attribute.e_transform:
            // Get transform matrix for this element. Unlike path.GetCTM() 
            // that return full transformation matrix gs.GetTransform() return 
            // only the transformation matrix that was installed for this element.
            //
            // gs.GetTransform();
            break;
          case PDFNet.GState.Attribute.e_line_width:
            // gs.GetLineWidth();
            break;
          case PDFNet.GState.Attribute.e_line_cap:
            // gs.GetLineCap();
            break;
          case PDFNet.GState.Attribute.e_line_join:
            // gs.GetLineJoin();
            break;
          case PDFNet.GState.Attribute.e_flatness:
            break;
          case PDFNet.GState.Attribute.e_miter_limit:
            // gs.GetMiterLimit();
            break;
          case PDFNet.GState.Attribute.e_dash_pattern:
            {
              // std::vector<double> dashes;
              // gs.GetDashes(dashes);
              // gs.GetPhase()
            }
            break;
          case PDFNet.GState.Attribute.e_fill_color:
            {
              if (await (await gs.getFillColorSpace()).getType() === PDFNet.ColorSpace.Type.e_pattern &&
                await (await gs.getFillPattern()).getType() !== PDFNet.PatternColor.Type.e_shading) {
                //process the pattern data
                await reader.patternBegin(true);
                await processElements(reader);
                await reader.end();
              }
            }
            break;
        }
      }
      await reader.clearChangeList();
    };

    const processText = async (pageReader) => {
      // Begin text element
      console.log('Begin Text Block:');

      let element;
      while (element = await pageReader.next()) {
        switch (await element.getType()) {
          case PDFNet.Element.Type.e_text_end:
            // Finish the text block
            console.log('End Text Block.');
            return;

          case PDFNet.Element.Type.e_text:
            const gs = await element.getGState();

            const cs_fill = await gs.getFillColorSpace();
            const fill = await gs.getFillColor();

            const out = await cs_fill.convert2RGB(fill);


            const cs_stroke = await gs.getStrokeColorSpace();
            const stroke = await gs.getStrokeColor();

            const font = await gs.getFont();

            console.log('Font Name: ' + await font.getName());

            let outPutStr = '';
            if (await font.getType() == PDFNet.Font.Type.e_Type3) {
              //type 3 font, process its data
              for (const itr = await element.getCharIterator(); await itr.hasNext(); await itr.next()) {
                await pageReader.type3FontBegin(await itr.current());
                await processElements(pageReader);
                await pageReader.end();
              }
            } else {
              const text_mtx = await element.getTextMatrix();

              for (const itr = await element.getCharIterator(); await itr.hasNext(); await itr.next()) {
                outPutStr += 'Character code: ';
                const charData = await itr.current();
                const charCode = charData.char_code;
                if (charCode >= 32 || charCode <= 127) {
                  // Print if in ASCII range...
                  outPutStr += String.fromCharCode(charCode);
                }

                const x = charData.x;		// character positioning information
                const y = charData.y;

                // Use element.GetCTM() if you are interested in the CTM 
                // (current transformation matrix).
                const ctm = await element.getCTM();

                // To get the exact character positioning information you need to 
                // concatenate current text matrix with CTM and then multiply 
                // relative positioning coordinates with the resulting matrix.
                await ctm.multiply(text_mtx);
                await ctm.mult(x, y);
              }
            }
            console.log(outPutStr);
            break;
        }
      }
    };

    const processImage = async (image) => {
      const width = await image.getImageWidth();
      const height = await image.getImageHeight();
      const out_data_sz = await width * height * 3;

      console.log('Image: width=\'' + width + '\' height=\'' + height + '\'');

      const img_conv = await PDFNet.Filter.createImage2RGBFromElement(image);	// Extract and convert image to RGB 8-bpc format
      const reader = await PDFNet.FilterReader.create(img_conv);

      const image_data_out = await reader.read(out_data_sz);

      // Note that you don't need to read a whole image at a time. Alternatively
      // you can read a chuck at a time by repeatedly calling reader.Read(buf, buf_sz) 
      // until the function returns 0. 
    }

    const processElements = async (reader) => {
      let element;
      while (element = await reader.next()) {	// Read page contents
        switch (await element.getType()) {
          case PDFNet.Element.Type.e_path:						// Process path data...
            await processPath(reader, element);
            break;
          case PDFNet.Element.Type.e_text_begin: 				// Process text block...
            await processText(reader);
            break;
          case PDFNet.Element.Type.e_form:						// Process form XObjects
            await reader.formBegin();
            await processElements(reader);
            await reader.end();
            break;
          case PDFNet.Element.Type.e_image:						// Process Images
            await processImage(element);
            break;
        }
      }
    }

    const main = async () => {
      // Relative path to the folder containing test files.
      const inputPath = '../../TestFiles/';
      try {
        console.log('-------------------------------------------------');
        console.log('Extract page element information from all ');
        console.log('pages in the document.');

        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'newsletter.pdf');
        doc.initSecurityHandler();

        const pgnum = await doc.getPageCount();
        const pageBegin = await doc.getPageIterator();

        const pageReader = await PDFNet.ElementReader.create();

        for (const itr = pageBegin; await itr.hasNext(); await itr.next())		//  Read every page
        {
          const curPage = await itr.current();
          console.log('Page ' + await curPage.getIndex() + '----------------------------------------');
          await pageReader.beginOnPage(curPage);
          await processElements(pageReader);
          await pageReader.end();
        }

        console.log('Done.');
      } catch (err) {
        console.log(err);
      }
    };
    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function (error) { console.log('Error: ' + JSON.stringify(error)); }).then(function () { PDFNet.shutdown(); });
  };
  exports.runElementReaderAdvTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=ElementReaderAdvTest.js
