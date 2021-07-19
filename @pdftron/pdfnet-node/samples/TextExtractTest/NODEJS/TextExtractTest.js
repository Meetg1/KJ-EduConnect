//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------


const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {

  exports.runTextExtractTest = async () => {
    // A utility method used to dump all text content in the console window.
    const dumpAllText = async (reader) => {
      let element;
      let bbox;
      let arr;
      while ((element = await reader.next()) !== null) {
        switch (await element.getType()) {
          case PDFNet.Element.Type.e_text_begin:
            console.log('\n--> Text Block Begin');
            break;
          case PDFNet.Element.Type.e_text_end:
            console.log('\n--> Text Block End');
            break;
          case PDFNet.Element.Type.e_text:
            bbox = await element.getBBox();
            console.log('\n--> BBox: ' + bbox.x1.toFixed(2) + ', ' + bbox.y1.toFixed(2) + ', ' + bbox.x2.toFixed(2) + ', ' + bbox.y2.toFixed(2) + '\n');
            arr = await element.getTextString();
            console.log(arr);
            break;
          case PDFNet.Element.Type.e_text_new_line:
            console.log('\n--> New Line');
            break;
          case PDFNet.Element.Type.e_form:
            reader.formBegin();
            await dumpAllText(reader);
            reader.end();
            break;
        }
      }
    };

    // helper method for ReadTextFromRect
    const rectTextSearch = async (reader, pos, srchStr) => {
      let element;
      let arr;
      while ((element = await reader.next()) !== null) {
        let bbox;
        switch (await element.getType()) {
          case PDFNet.Element.Type.e_text:
            bbox = await element.getBBox();
            if (await bbox.intersectRect(bbox, pos)) {
              arr = await element.getTextString();
              srchStr += arr + '\n';
            }
            break;
          case PDFNet.Element.Type.e_text_new_line:
            break;
          case PDFNet.Element.Type.e_form:
            reader.formBegin();
            srchStr += await rectTextSearch(reader, pos, srchStr); // possibly need srchStr = ...
            reader.end();
            break;
        }
      }
      return srchStr;
    };

    const readTextFromRect = async (page, pos, reader) => {
      let srchStr = '';
      reader.beginOnPage(page); // uses default parameters.
      srchStr += await rectTextSearch(reader, pos, srchStr);
      reader.end();
      return srchStr;
    };

    const twoDigitHex = function (num) {
      const hexStr = num.toString(16).toUpperCase();
      return ('0' + hexStr).substr(-2);
    }

    const printStyle = async (s) => {
      const rgb = await s.getColor();
      const rColorVal = await rgb.get(0);
      const gColorVal = await rgb.get(1);
      const bColorVal = await rgb.get(2);
      const rgbHex = twoDigitHex(rColorVal) + twoDigitHex(gColorVal) + twoDigitHex(bColorVal)
      const fontName = await s.getFontName();
      const fontSize = await s.getFontSize();
      const serifOutput = ((await s.isSerif()) ? ' sans-serif; ' : ' ');
      const returnString = ' style="font-family:' + fontName + '; font-size:' + fontSize + ';' + serifOutput + 'color:#' + rgbHex + ';"';
      return returnString;
    };

    const main = async () => {
      // eslint-disable-next-line no-unused-vars
      let ret = 0;

      // Relative path to the folder containing test files.
      const inputPath = '../../TestFiles/';
      const inputFilename = 'newsletter.pdf'; // addimage.pdf, newsletter.pdf

      const example1Basic = false;
      const example2XML = false;
      const example3Wordlist = false;
      const example4Advanced = true;
      const example5LowLevel = false;

      try {
        await PDFNet.startDeallocateStack();
        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + inputFilename);
        doc.initSecurityHandler();

        const page = await doc.getPage(1);

        if (page.id === '0') {
          console.log('Page not found.');
          return 1;
        }

        const txt = await PDFNet.TextExtractor.create();
        txt.begin(page);

        let text;
        let line;
        let word;

        // Example 1. Get all text on the page in a single string.
        // Words will be separated with space or new line characters.
        if (example1Basic) {
          const wordCount = await txt.getWordCount();
          console.log('Word Count: ' + wordCount);
          text = await txt.getAsText();
          console.log('\n\n- GetAsText --------------------------');
          console.log(text);
          console.log('-----------------------------------------------------------');
        }

        // Example 2. Get XML logical structure for the page.
        if (example2XML) {
          text = await txt.getAsXML(PDFNet.TextExtractor.XMLOutputFlags.e_words_as_elements | PDFNet.TextExtractor.XMLOutputFlags.e_output_bbox | PDFNet.TextExtractor.XMLOutputFlags.e_output_style_info);
          console.log('\n\n- GetAsXML  --------------------------\n' + text);
          console.log('-----------------------------------------------------------');
        }

        // Example 3. Extract words one by one.
        if (example3Wordlist) {
          line = await txt.getFirstLine();
          for (; (await line.isValid()); line = (await line.getNextLine())) {
            for (word = await line.getFirstWord(); await word.isValid(); word = await word.getNextWord()) {
              text = await word.getString();
              console.log(text);
            }
          }
          console.log('-----------------------------------------------------------');
        }

        // Example 4. A more advanced text extraction example. 
        // The output is XML structure containing paragraphs, lines, words, 
        // as well as style and positioning information.
        if (example4Advanced) {
          let b;
          let q;
          let curFlowID = -1;
          let curParaID = -1;

          console.log('<PDFText>');

          // For each line on the page...
          for (line = await txt.getFirstLine(); await line.isValid(); line = await line.getNextLine()) {
            if ((await line.getNumWords()) === 0) {
              continue;
            }
            if (curFlowID !== await line.getFlowID()) {
              if (curFlowID !== -1) {
                if (curParaID !== -1) {
                  curParaID = -1;
                  console.log('</Para>');
                }
                console.log('</Flow>');
              }
              curFlowID = await line.getFlowID();
              console.log('<Flow id="' + curFlowID + '">');
            }
            if (curParaID !== await line.getParagraphID()) {
              if (curParaID !== -1) {
                console.log('</Para>');
              }
              curParaID = await line.getParagraphID();
              console.log('<Para id="' + curParaID + '">');
            }
            b = await line.getBBox();
            const lineStyle = await line.getStyle();
            let outputStringLineBox = '<Line box="' + b.x1.toFixed(2) + ', ' + b.y1.toFixed(2) + ', ' + b.x2.toFixed(2) + ', ' + b.y2.toFixed(2) + '"';
            outputStringLineBox += (await printStyle(lineStyle));
            const currentLineNum = await line.getCurrentNum();
            outputStringLineBox += ' cur_num="' + currentLineNum + '">';
            console.log(outputStringLineBox);

            // For each word in the line...
            for (word = await line.getFirstWord(); await word.isValid(); word = await word.getNextWord()) {
              // output bounding box for the word
              q = await word.getBBox();
              const currentNum = await word.getCurrentNum();
              let outputStringWord = '<Word box="' + q.x1.toFixed(2) + ', ' + q.y1.toFixed(2) + ', ' + q.x2.toFixed(2) + ', ' + q.y2.toFixed(2) + '" cur_num="' + currentNum + '"';
              const sz = await word.getStringLen();
              if (sz === 0) {
                continue;
              }
              // if the word style is different from the parent style, output the new style
              const sty = await word.getStyle();
              if (!(await sty.compare(lineStyle))) {
                outputStringWord += await printStyle(sty);
              }
              outputStringWord += '>' + (await word.getString()) + '</Word>';
              console.log(outputStringWord);
            }
            console.log('</Line>');
          }
          if (curFlowID !== -1) {
            if (curParaID !== -1) {
              curParaID = -1;
              console.log('</Para>');
            }
            console.log('</Flow>');
          }
          console.log('</PDFText>');
        }
        await PDFNet.endDeallocateStack();
      } catch (err) {
        console.log(err);
        console.log(err.stack);
        ret = 1;
      }


      if (example5LowLevel) {
        ret = 0;
        try {
          await PDFNet.startDeallocateStack();
          const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + inputFilename);
          doc.initSecurityHandler();

          // Example 1. Extract all text content from the document
          const reader = await PDFNet.ElementReader.create();
          const itr = await doc.getPageIterator(1);

          //  Read every page
          for (itr; await itr.hasNext(); itr.next()) {
            const page = await itr.current();
            reader.beginOnPage(page);
            await dumpAllText(reader);
            reader.end();
          }
          // Example 2. Extract text content based on the
          // selection rectangle.
          console.log('\n----------------------------------------------------');
          console.log('Extract text based on the selection rectangle.');
          console.log('----------------------------------------------------');


          const firstPage = await (await doc.getPageIterator()).current();
          let s1 = await readTextFromRect(firstPage, (await PDFNet.Rect.init(27, 392, 563, 534)), reader);
          console.log('\nField 1: ' + s1);

          s1 = await readTextFromRect(firstPage, (await PDFNet.Rect.init(28, 551, 106, 623)), reader);
          console.log('Field 2: ' + s1);

          s1 = await readTextFromRect(firstPage, (await PDFNet.Rect.init(208, 550, 387, 621)), reader);
          console.log('Field 3: ' + s1);

          // ...
          console.log('Done');
          await PDFNet.endDeallocateStack();
        } catch (err) {
          console.log(err.stack);
          ret = 1;
        }
      }
    };
    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function (error) { console.log('Error: ' + JSON.stringify(error)); }).then(function () { PDFNet.shutdown(); });
  };
  exports.runTextExtractTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=TextExtractTest.js