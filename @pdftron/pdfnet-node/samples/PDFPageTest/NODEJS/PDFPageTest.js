//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {

  exports.runPDFPageTest = () => {

    const main = async () => {
      // Relative path to the folder containing test files.
      const inputPath = '../../TestFiles/';
      const outputPath = inputPath + 'Output/';

      // Sample 1 - Split a PDF document into multiple pages
      try {
        console.log('_______________________________________________');
        console.log('Sample 1 - Split a PDF document into multiple pages...');
        console.log('Opening the input pdf...');
        const inDoc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'newsletter.pdf');
        inDoc.initSecurityHandler();

        const pageCount = await inDoc.getPageCount();
        for (let i = 1; i <= pageCount; ++i) {
          const newDoc = await PDFNet.PDFDoc.create();
          const filename = 'newsletter_split_page_' + i + '.pdf';
          newDoc.insertPages(0, inDoc, i, i, PDFNet.PDFDoc.InsertFlag.e_none);
          await newDoc.save(outputPath + filename, PDFNet.SDFDoc.SaveOptions.e_remove_unused);
          console.log('Done. Result saved in ' + filename);
        }
      } catch (err) {
        // console.log(err);
        console.log(err.stack);
      }

      // Sample 2 - Merge several PDF documents into one
      try {
        console.log('_______________________________________________');
        console.log('Sample 2 - Merge several PDF documents into one...');

        // start stack-based deallocation with startDeallocateStack. Later on when endDeallocateStack is called,
        // all objects in memory that were initialized since the most recent startDeallocateStack call will be
        // cleaned up. Doing this makes sure that memory growth does not get too high.
        await PDFNet.startDeallocateStack();
        const newDoc = await PDFNet.PDFDoc.create();
        newDoc.initSecurityHandler();

        const pageNum = 15
        for (let i = 1; i <= pageNum; ++i) {
          const fname = 'newsletter_split_page_' + i + '.pdf';
          console.log('Opening ' + fname);
          const currDoc = await PDFNet.PDFDoc.createFromFilePath(outputPath + fname);
          const currDocPageCount = await currDoc.getPageCount();
          newDoc.insertPages(i, currDoc, 1, currDocPageCount, PDFNet.PDFDoc.InsertFlag.e_none);
        }
        await newDoc.save(outputPath + 'newsletter_merge_pages.pdf', PDFNet.SDFDoc.SaveOptions.e_remove_unused);
        console.log('Done. Result saved in newsletter_merge_pages.pdf');
        await PDFNet.endDeallocateStack();
      } catch (err) {
        // console.log(err);
        console.log(err.stack);
        ret = 1;
      }

      // Sample 3 - Delete every second page
      try {
        console.log('_______________________________________________');
        console.log('Sample 3 - Delete every second page...');
        console.log('Opening the input pdf...');
        await PDFNet.startDeallocateStack();
        const inDoc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'newsletter.pdf');
        inDoc.initSecurityHandler();

        let pageNum = await inDoc.getPageCount();

        while (pageNum >= 1) {
          const itr = await inDoc.getPageIterator(pageNum);
          inDoc.pageRemove(itr);
          pageNum -= 2;
        }

        await inDoc.save(outputPath + 'newsletter_page_remove.pdf', 0);
        console.log('Done. Result saved in newsletter_page_remove.pdf...');
        await PDFNet.endDeallocateStack();
      } catch (err) {
        console.log(err);
        ret = 1;
      }

      // Sample 4 - Inserts a page from one document at different 
      // locations within another document
      try {
        console.log('_______________________________________________');
        console.log('Sample 4 - Insert a page at different locations...');
        console.log('Opening the input pdf...');
        await PDFNet.startDeallocateStack();
        const in1Doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'newsletter.pdf');
        in1Doc.initSecurityHandler();

        const in2Doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'fish.pdf');
        in2Doc.initSecurityHandler();

        const srcPage = await in2Doc.getPageIterator();
        const dstPage = await in1Doc.getPageIterator();
        let pageNum = 1;
        while (await dstPage.hasNext()) {
          if (pageNum++ % 3 === 0) {
            in1Doc.pageInsert(dstPage, await srcPage.current());
          }
          dstPage.next();
        }

        await in1Doc.save(outputPath + 'newsletter_page_insert.pdf', 0);
        console.log('Done. Result saved in newsletter_page_insert.pdf...');
        await PDFNet.endDeallocateStack();
      } catch (err) {
        console.log(err.stack);
        ret = 1;
      }

      // Sample 5 - Replicate pages within a single document
      try {
        console.log('_______________________________________________');
        console.log('Sample 5 - Replicate pages within a single document...');
        console.log('Opening the input pdf...');
        await PDFNet.startDeallocateStack();
        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'newsletter.pdf');
        doc.initSecurityHandler();

        // Replicate the cover page three times (copy page #1 and place it before the
        // seventh page in the document page sequence)
        const cover = await doc.getPage(1);
        const p7 = await doc.getPageIterator(7);
        doc.pageInsert(p7, cover);
        doc.pageInsert(p7, cover);
        doc.pageInsert(p7, cover);
        // replicate cover page two more times by placing it before and after existing pages
        doc.pagePushFront(cover);
        doc.pagePushBack(cover);

        await doc.save(outputPath + 'newsletter_page_clone.pdf', 0);
        console.log('Done. Result saved in newsletter_page_clone.pdf...');
        await PDFNet.endDeallocateStack();
      } catch (err) {
        console.log(err.stack);
        ret = 1;
      }

      // Sample 6 - Use ImportPages() in order to copy multiple pages at once 
      // in order to preserve shared resources between pages (e.g. images, fonts, 
      // colorspaces, etc.)
      try {
        console.log('_______________________________________________');
        console.log('Sample 6 - Preserving shared resources using ImportPages...');
        console.log('Opening the input pdf...');
        const in_doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'newsletter.pdf');
        in_doc.initSecurityHandler();

        const new_doc = await PDFNet.PDFDoc.create();

        const copy_pages = [];
        for (const itr = await in_doc.getPageIterator(); await itr.hasNext(); await itr.next()) {
          copy_pages.push(await itr.current());
        }

        const imported_pages = await new_doc.importPages(copy_pages);
        for (var i = 0; i < imported_pages.length; ++i) {
          new_doc.pagePushFront(imported_pages[i]); // Order pages in reverse order. 
          // Use PagePushBack() if you would like to preserve the same order.
        }

        await new_doc.save(outputPath + 'newsletter_import_pages.pdf', 0);
        console.log('Done. Result saved in newsletter_import_pages.pdf...\n');
        console.log('Note that the output file size is less than half the size\n'
         + 'of the file produced using individual page copy operations\n'
          + 'between two documents');
      } catch (err) {
        console.log(err.stack);
      }
    };

    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function (error) { console.log('Error: ' + JSON.stringify(error)); }).then(function () { PDFNet.shutdown(); });
  };
  exports.runPDFPageTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=PDFPageTest.js