//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------
// This sample shows encryption support in PDFNet. The sample reads an encrypted document and 
// sets a new SecurityHandler. The sample also illustrates how password protection can 
// be removed from an existing PDF document.
//---------------------------------------------------------------------------------------
const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {
  exports.runEncTest = () => {

    const main = async () => {
      let ret = 0;
      // Relative path to the folder containing test files.
      const inputPath = '../../TestFiles/';
      const outputPath = inputPath + 'Output/';
      // Example 1:
      // secure a PDF document with password protection and adjust permissions
      try {
        // Open the test file
        console.log('-------------------------------------------------/nSecuring an existing document...');
        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'fish.pdf');
        if (!(await doc.initSecurityHandler())) {
          console.log('Document authentication error...');
          ret = 1;
        }

        const performOperation = true; // optional parameter

        // Perform some operation on the document. In this case we use low level SDF API
        // to replace the content stream of the first page with contents of file 'my_stream.txt'
        // Results in fish.pdf becoming a pair of feathers.
        if (performOperation) {
          console.log('Replacing the content stream, use Flate compression...');
          // Get the page dictionary using the following path: trailer/Root/Pages/Kids/0
          const pageTrailer = await doc.getTrailer();
          const pageRoot = await pageTrailer.get('Root');
          const pageRootValue = await pageRoot.value();
          const pages = await pageRootValue.get('Pages');
          const pagesVal = await pages.value();
          const kids = await pagesVal.get('Kids');
          const kidsVal = await kids.value();
          const pageDict = await kidsVal.getAt(0);

          const embedFile = await PDFNet.Filter.createMappedFileFromUString(inputPath + 'my_stream.txt');
          const mystm = await PDFNet.FilterReader.create(embedFile);

          const flateEncode = await PDFNet.Filter.createFlateEncode();

          const indStream = await doc.createIndirectStreamFromFilter(mystm, flateEncode);
          await pageDict.put('Contents', indStream);
        }

        // Encrypt the document
        // Apply a new security handler with given security settings.
        // In order to open saved PDF you will need a user password 'test'.
        const newHandler = await PDFNet.SecurityHandler.createDefault();

        // Set a new password required to open a document
        newHandler.changeUserPasswordUString('test');

        // Set Permissions
        newHandler.setPermission(PDFNet.SecurityHandler.Permission.e_print, true);
        await newHandler.setPermission(PDFNet.SecurityHandler.Permission.e_extract_content, false);

        // Note: document takes the ownership of newHandler.
        doc.setSecurityHandler(newHandler);

        // Save the changes
        console.log('Saving modified file...');
        await doc.save(outputPath + 'secured.pdf', 0);
        console.log('Done. Result saved in secured.pdf');
      } catch (err) {
        console.log(err);
        console.log(err.stack);
        ret = 1;
      }

      // Example 2:
      // Opens an encrypted PDF document and removes its security.
      try {
        console.log('-------------------------------------------------');
        console.log('Open the password protected document from the first example...');
        const securedDoc = await PDFNet.PDFDoc.createFromFilePath(outputPath + 'secured.pdf');
        console.log('Initializing security handler without any user interaction...');

        // At this point MySecurityHandler callbacks will be invoked. 
        // MySecurityHandler.GetAuthorizationData() should collect the password and 
        // AuthorizeFailed() is called if user repeatedly enters a wrong password.
        if (!(await securedDoc.initStdSecurityHandlerUString('test'))) {
          console.log('Document authentication error.../nThe password is not valid.');
          ret = 1;
          return ret;
        }

        console.log('The password is correct! Document can now be used for reading and editing');

        // Remove the password security and save the changes to a new file.
        securedDoc.removeSecurity();
        await securedDoc.save(outputPath + 'secured_nomore1.pdf', 0);
        console.log('Done. Result saved in secured_nomore1.pdf');

        /*
        const hdlr = await securedDoc.getSecurityHandler();

        console.log('Document Open Password: ' + (await hdlr.isUserPasswordRequired()));
        console.log('Permissions Password: ' + (await hdlr.isMasterPasswordRequired()));
        console.log('Permissions: ');
        console.log("\tHas 'owner' permissions: " + (await hdlr.getPermission(PDFNet.SecurityHandler.Permission.e_owner)));

        console.log('\tOpen and decrypt the document: ' + (await hdlr.getPermission(PDFNet.SecurityHandler.Permission.e_doc_open)));
        console.log('\tAllow content extraction: ' + (await hdlr.getPermission(PDFNet.SecurityHandler.Permission.e_extract_content)));
        console.log('\tAllow full document editing: ' + (await hdlr.getPermission(PDFNet.SecurityHandler.Permission.e_doc_modify)));
        console.log('\tAllow printing: ' + (await hdlr.getPermission(PDFNet.SecurityHandler.Permission.e_print)));
        console.log('\tAllow high resolution printing: ' + (await hdlr.getPermission(PDFNet.SecurityHandler.Permission.e_print_high)));
        console.log('\tAllow annotation editing: ' + (await hdlr.getPermission(PDFNet.SecurityHandler.Permission.e_mod_annot)));
        console.log('\tAllow form fill: ' + (await hdlr.getPermission(PDFNet.SecurityHandler.Permission.e_fill_forms)));
        console.log('\tAllow content extraction for accessibility: ' + (await hdlr.getPermission(PDFNet.SecurityHandler.Permission.e_access_support)));
        console.log('\tAllow document assembly: ' + (await hdlr.getPermission(PDFNet.SecurityHandler.Permission.e_assemble_doc)));
        */
      } catch (err) {
        console.log(err.stack);
        ret = 1;
      }

      // Example 3:
      // Encrypt/Decrypt a PDF using PDFTron custom security handler
      try {
        console.log('-------------------------------------------------');
        console.log('Encrypt a document using PDFTron Custom Security handler with a custom id and password...');
        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + "BusinessCardTemplate.pdf");

        // Create PDFTron custom security handler with a custom id. Replace this with your own integer
        const custom_id = 123456789;
        const custom_handler = await PDFNet.PDFTronCustomSecurityHandler.create(custom_id);

        // Add a password to the custom security handler
        const pass = 'test';
        await custom_handler.changeUserPasswordUString(pass);

        // Save the encrypted document
        doc.setSecurityHandler(custom_handler);
        await doc.save(outputPath + 'BusinessCardTemplate_enc.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);

        console.log('Decrypt the PDFTron custom security encrypted document above...');
        // Register the PDFTron Custom Security handler with the same custom id used in encryption
        await PDFNet.addPDFTronCustomHandler(custom_id);

        const doc_enc = await PDFNet.PDFDoc.createFromFilePath(outputPath + 'BusinessCardTemplate_enc.pdf');
        doc_enc.initStdSecurityHandlerUString(pass);
        doc_enc.removeSecurity();
        // Save the decrypted document
        await doc_enc.save(outputPath + 'BusinessCardTemplate_enc_dec.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);
        console.log('Done. Result saved in BusinessCardTemplate_enc_dec.pdf');
      } catch (err) {
        console.log(err.stack);
        ret = 1;
      }

      console.log('-------------------------------------------------');
      console.log('Tests completed.');

      return ret;
    };

    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function (error) { console.log('Error: ' + JSON.stringify(error)); }).then(function () { PDFNet.shutdown(); });
  };
  exports.runEncTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=EncTest.js