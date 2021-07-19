//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

const fs = require('fs')
const process = require('process');
const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {

  exports.runUnicodeWriteTest = () => {

    const main = async () => {
      try {
        // Relative path to the folder containing test files.
        const inputPath = '../../TestFiles/';
        const outputPath = '../../TestFiles/Output/';

        const doc = await PDFNet.PDFDoc.create();
        doc.initSecurityHandler();

        const eb = await PDFNet.ElementBuilder.create(); // ElementBuilder, used to build new element Objects
        const writer = await PDFNet.ElementWriter.create(); // ElementWriter, used to write elements to the page

        // Start a new page ------------------------------------
        let page = await doc.pageCreate(new PDFNet.Rect(0, 0, 612, 794));

        await writer.beginOnPage(page);

        let font_program = inputPath + 'ARIALUNI.TTF';

        if (!fs.existsSync(font_program)) {
          font_program = 'C:/Windows/Fonts/ARIALUNI.TTF';
          if (process.platform !== 'win32' || !fs.existsSync(font_program)) {
            font_program = '';
          }
        }

        let fnt;
        if (font_program.length) {
          console.log('Note: using ' + font_program + ' for unshaped unicode text');
          // if we can find a specific wide-coverage font file, then use that directly
          fnt = await PDFNet.Font.createCIDTrueTypeFont(doc, font_program, true, true);
        } else {
          console.log('Note: using system font substitution for unshaped unicode text');
          // if we can't find a specific file, then use system font subsitution 
          // as a fallback, using 'Helvetica' as a hint
          fnt = await PDFNet.Font.createFromName(doc, 'Helvetica', '');
        }

        let element = await eb.createTextBeginWithFont(fnt, 1);
        await element.setTextMatrixEntries(10, 0, 0, 10, 50, 600);
        await (await element.getGState()).setLeading(2);		 // Set the spacing between lines
        await writer.writeElement(element);

        // Hello World!
        const hello = 'Hello World!';
        await writer.writeElement(await eb.createUnicodeTextRun(hello));
        await writer.writeElement(await eb.createTextNewLine());

        // Latin
        const latin = 'aAbBcCdD' + String.fromCharCode(0x45, 0x0046, 0x00C0, 0x00C1, 0x00C2, 0x0143, 0x0144, 0x0145, 0x0152) + '12';
        await writer.writeElement(await eb.createUnicodeTextRun(latin));
        await writer.writeElement(await eb.createTextNewLine());

        // Greek
        const greek = String.fromCharCode(0x039E, 0x039F, 0x03A0, 0x03A1, 0x03A3, 0x03A6, 0x03A8, 0x03A9);
        await writer.writeElement(await eb.createUnicodeTextRun(greek));
        await writer.writeElement(await eb.createTextNewLine());

        // Cyrillic
        const cyrillic = String.fromCharCode(
          0x0409, 0x040A, 0x040B, 0x040C, 0x040E, 0x040F, 0x0410, 0x0411,
          0x0412, 0x0413, 0x0414, 0x0415, 0x0416, 0x0417, 0x0418, 0x0419);
        await writer.writeElement(await eb.createUnicodeTextRun(cyrillic));
        await writer.writeElement(await eb.createTextNewLine());

        // Hebrew
        const hebrew = String.fromCharCode(
          0x05D0, 0x05D1, 0x05D3, 0x05D3, 0x05D4, 0x05D5, 0x05D6, 0x05D7, 0x05D8,
          0x05D9, 0x05DA, 0x05DB, 0x05DC, 0x05DD, 0x05DE, 0x05DF, 0x05E0, 0x05E1);
        await writer.writeElement(await eb.createUnicodeTextRun(hebrew));
        await writer.writeElement(await eb.createTextNewLine());

        // Arabic
        const arabic = String.fromCharCode(
          0x0624, 0x0625, 0x0626, 0x0627, 0x0628, 0x0629, 0x062A, 0x062B, 0x062C,
          0x062D, 0x062E, 0x062F, 0x0630, 0x0631, 0x0632, 0x0633, 0x0634, 0x0635);
        await writer.writeElement(await eb.createUnicodeTextRun(arabic));
        await writer.writeElement(await eb.createTextNewLine());

        // Thai 
        const thai = String.fromCharCode(
          0x0E01, 0x0E02, 0x0E03, 0x0E04, 0x0E05, 0x0E06, 0x0E07, 0x0E08, 0x0E09,
          0x0E0A, 0x0E0B, 0x0E0C, 0x0E0D, 0x0E0E, 0x0E0F, 0x0E10, 0x0E11, 0x0E12);
        await writer.writeElement(await eb.createUnicodeTextRun(thai));
        await writer.writeElement(await eb.createTextNewLine());

        // Hiragana - Japanese 
        const hiragana = String.fromCharCode(
          0x3041, 0x3042, 0x3043, 0x3044, 0x3045, 0x3046, 0x3047, 0x3048, 0x3049,
          0x304A, 0x304B, 0x304C, 0x304D, 0x304E, 0x304F, 0x3051, 0x3051, 0x3052);
        await writer.writeElement(await eb.createUnicodeTextRun(hiragana));
        await writer.writeElement(await eb.createTextNewLine());

        // CJK Unified Ideographs
        const cjk_uni = String.fromCharCode(
          0x5841, 0x5842, 0x5843, 0x5844, 0x5845, 0x5846, 0x5847, 0x5848, 0x5849,
          0x584A, 0x584B, 0x584C, 0x584D, 0x584E, 0x584F, 0x5850, 0x5851, 0x5852);
        await writer.writeElement(await eb.createUnicodeTextRun(cjk_uni));
        await writer.writeElement(await eb.createTextNewLine());

        // Simplified Chinese
        const chinese_simplified = String.fromCharCode(0x4e16, 0x754c, 0x60a8, 0x597d);
        await writer.writeElement(await eb.createUnicodeTextRun(chinese_simplified));
        await writer.writeElement(await eb.createTextNewLine());

        // Finish the block of text
        await writer.writeElement(await eb.createTextEnd());

        console.log('Now using text shaping logic to place text');

        // Create a font in indexed encoding mode 
        // normally this would mean that we are required to provide glyph indices
        // directly to CreateUnicodeTextRun, but instead, we will use the GetShapedText
        // method to take care of this detail for us.
        const indexed_font = await PDFNet.Font.createCIDTrueTypeFont(doc, inputPath + 'NotoSans_with_hindi.ttf', true, true, PDFNet.Font.Encoding.e_Indices);
        element = await eb.createTextBeginWithFont(indexed_font, 10);
        await writer.writeElement(element);

        const line_pos = 350.0;
        const line_space = 20.0;

        // Transform unicode text into an abstract collection of glyph indices and positioning info 
        let shaped_text = await indexed_font.getShapedText('Shaped Hindi Text:');

        // transform the shaped text info into a PDF element and write it to the page
        element = await eb.createShapedTextRun(shaped_text);
        await element.setTextMatrixEntries(1.5, 0, 0, 1.5, 50, line_pos);
        await writer.writeElement(element);

        // read in unicode text lines from a file 
        const hindi_text = fs.readFileSync(inputPath + 'hindi_sample_utf16le.txt', 'utf16le').toString().split(/\n/);

        console.log('Read in ' + hindi_text.length + ' lines of Unicode text from file');
        for (let i = 0; i < hindi_text.length; ++i) {
          shaped_text = await indexed_font.getShapedText(hindi_text[i]);
          element = await eb.createShapedTextRun(shaped_text);
          await element.setTextMatrixEntries(1.5, 0, 0, 1.5, 50, line_pos - line_space * (i + 1));
          await writer.writeElement(element);
          console.log('Wrote shaped line to page');
        }

        // Finish the shaped block of text
        await writer.writeElement(await eb.createTextEnd());

        await writer.end();  // save changes to the current page
        await doc.pagePushBack(page);

        await doc.save(outputPath + 'unicodewrite.pdf', PDFNet.SDFDoc.SaveOptions.e_remove_unused | PDFNet.SDFDoc.SaveOptions.e_hex_strings);

        console.log('Done. Result saved in unicodewrite.pdf...');
      } catch (err) {
        console.log(err);
      }
    };
    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function (error) { console.log('Error: ' + JSON.stringify(error)); }).then(function () { PDFNet.shutdown(); });
  };
  exports.runUnicodeWriteTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=UnicodeWriteTest.js