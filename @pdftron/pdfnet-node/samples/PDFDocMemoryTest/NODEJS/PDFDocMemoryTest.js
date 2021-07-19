//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

const fs = require('fs');
const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {
  'use strict';

  exports.runPDFDocMemoryTest = () => {
    const main = async () => {
      const outputPath = '../../TestFiles/Output/';

      // The following sample illustrates how to read/write a PDF document from/to 
      // a memory buffer. This is useful for applications that work with dynamic PDF
      // documents that don't need to be saved/read from a disk.
      try {
        // Read a PDF document in a memory buffer.
        const file = await PDFNet.Filter.createMappedFileFromUString('../../TestFiles/tiger.pdf');
        const file_sz = await file.mappedFileFileSize();

        const file_reader = await PDFNet.FilterReader.create(file);

        const mem = await file_reader.read(file_sz);
        const doc = await PDFNet.PDFDoc.createFromBuffer(mem);

        doc.initSecurityHandler();
        const num_pages = await doc.getPageCount();

        const writer = await PDFNet.ElementWriter.create();
        const reader = await PDFNet.ElementReader.create();

        // Create a duplicate of every page but copy only path objects
        for (let i = 1; i <= num_pages; ++i) {
          const itr = await doc.getPageIterator(2 * i - 1);

          const cur_page = await itr.current();
          reader.beginOnPage(cur_page);
          const new_page = await doc.pageCreate(await cur_page.getMediaBox());
          itr.next();
          doc.pageInsert(itr, new_page);

          writer.beginOnPage(new_page);
          var element;
          while (element = await reader.next()) {	// Read page contents
            writer.writeElement(element);
          }

          await writer.end();
          await reader.end();
        }

        doc.save(outputPath + 'doc_memory_edit.pdf', PDFNet.SDFDoc.SaveOptions.e_remove_unused);

        // Save the document to a memory buffer.
        const docbuf = await doc.saveMemoryBuffer(PDFNet.SDFDoc.SaveOptions.e_remove_unused);

        // Write the contents of the buffer to the disk
        fs.appendFileSync(outputPath + 'doc_memory_edit.txt', docbuf);

        let dataStr = ''
        // Read some data from the file stored in memory
        reader.beginOnPage(await doc.getPage(1));
        while (element = await reader.next()) {
          if (await element.getType() == PDFNet.Element.Type.e_path) dataStr += 'Path, ';
        }
        reader.end();
        console.log(dataStr);

        console.log('\nDone. Result saved in doc_memory_edit.pdf and doc_memory_edit.txt ...');
      } catch (err) {
        console.log(err);
      }
    }
    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function(error) {
      console.log('Error: ' + JSON.stringify(error));
    }).then(function(){ PDFNet.shutdown(); });
  };
  exports.runPDFDocMemoryTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=PDFDocMemoryTest.js