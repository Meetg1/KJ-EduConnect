//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------
// PDFNet includes a full support for FDF (Forms Data Format) and capability to merge/extract 
// forms data (FDF) with/from PDF. This sample illustrates basic FDF merge/extract functionality 
// available in PDFNet.
//---------------------------------------------------------------------------------------

const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {

  exports.runFDFTest = () => {
    const main = async () => {
      const inputPath = '../../TestFiles/';
      const outputPath = '../../TestFiles/Output/';

      // Example 1)
      // Iterate over all form fields in the document. Display all field names.
      try {
        const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'form1.pdf');
        doc.initSecurityHandler();

        for (const itr = await doc.getFieldIteratorBegin(); await itr.hasNext(); itr.next()) {
          const field = await itr.current();
          console.log('Field name: ' + await field.getName());
          console.log('Field partial name: ' + await field.getPartialName());

          switch (await field.getType()) {
            case PDFNet.Field.Type.e_button:
              console.log('Field type: Button');
              break;
            case PDFNet.Field.Type.e_check:
              console.log('Field type: Check');
              break;
            case PDFNet.Field.Type.e_radio:
              console.log('Field type: Radio');
              break;
            case PDFNet.Field.Type.e_text:
              console.log('Field type: Text');
              break;
            case PDFNet.Field.Type.e_choice:
              console.log('Field type: Choice');
              break;
            case PDFNet.Field.Type.e_signature:
              console.log('Field type: Signature');
              break;
            default:
              console.log('Field type: Null');
              break;
          }
          console.log('------------------------------')
        }
        console.log('Done.');
      } catch (err) {
        console.log(err);
      }

      // Example 2) Import XFDF into FDF, then merge data from FDF into PDF
      try {
        // FDF to PDF
        // form fields
        console.log('Import form field data from XFDF to FDF.');

        const fdf_doc1 = await PDFNet.FDFDoc.createFromXFDF(inputPath + 'form1_data.xfdf');
        await fdf_doc1.save(outputPath + 'form1_data.fdf');

        // annotations
        console.log('Import annotations from XFDF to FDF.');

        const fdf_doc2 = await PDFNet.FDFDoc.createFromXFDF(inputPath + 'form1_annots.xfdf');
        await fdf_doc2.save(outputPath + 'form1_annots.fdf');

        // FDF to PDF
        // form fields
        console.log('Merge form field data from FDF.');

        const doc = await PDFNet.PDFDoc.createFromFilePath(`${inputPath}form1.pdf`);
        doc.initSecurityHandler();
        await doc.fdfMerge(fdf_doc1);

        // Refreshing missing appearances is not required here, but is recommended to make them 
        // visible in PDF viewers with incomplete annotation viewing support. (such as Chrome)
        doc.refreshAnnotAppearances();

        await doc.save(outputPath + 'form1_filled.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);

        // annotations
        console.log('Merge annotations from FDF.');

        await doc.fdfMerge(fdf_doc2);
        // Refreshing missing appearances is not required here, but is recommended to make them 
        // visible in PDF viewers with incomplete annotation viewing support. (such as Chrome)
        doc.refreshAnnotAppearances();
        await doc.save(outputPath + 'form1_filled_with_annots.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);
        console.log('Done.');
      } catch (err) {
        console.log(err);
      }


      // Example 3) Extract data from PDF to FDF, then export FDF as XFDF
      try {
        // PDF to FDF
        const in_doc = await PDFNet.PDFDoc.createFromFilePath(outputPath + 'form1_filled_with_annots.pdf');
        in_doc.initSecurityHandler();

        // form fields only
        console.log('Extract form fields data to FDF.');

        const doc_fields = await in_doc.fdfExtract(PDFNet.PDFDoc.ExtractFlag.e_forms_only);
        doc_fields.setPDFFileName('../form1_filled_with_annots.pdf');
        await doc_fields.save(outputPath + 'form1_filled_data.fdf');

        // annotations only
        console.log('Extract annotations to FDF.');

        const doc_annots = await in_doc.fdfExtract(PDFNet.PDFDoc.ExtractFlag.e_annots_only);
        doc_annots.setPDFFileName('../form1_filled_with_annots.pdf');
        await doc_annots.save(outputPath + 'form1_filled_annot.fdf');

        // both form fields and annotations
        console.log('Extract both form fields and annotations to FDF.');

        const doc_both = await in_doc.fdfExtract(PDFNet.PDFDoc.ExtractFlag.e_both);
        doc_both.setPDFFileName('../form1_filled_with_annots.pdf');
        await doc_both.save(outputPath + 'form1_filled_both.fdf');

        // FDF to XFDF
        // form fields
        console.log('Export form field data from FDF to XFDF.');

        await doc_fields.saveAsXFDF(outputPath + 'form1_filled_data.xfdf');

        // annotations
        console.log('Export annotations from FDF to XFDF.');

        await doc_annots.saveAsXFDF(outputPath + 'form1_filled_annot.xfdf');

        // both form fields and annotations
        console.log('Export both form fields and annotations from FDF to XFDF.');

        await doc_both.saveAsXFDF(outputPath + 'form1_filled_both.xfdf');

        console.log('Done.');
      } catch (err) {
        console.log(err);
      }

      // Example 4) Merge/Extract XFDF into/from PDF
      try {
        // Merge XFDF from string
        const in_doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'numbered.pdf');
        in_doc.initSecurityHandler();

        console.log('Merge XFDF string into PDF.');

        const str = `<?xml version="1.0" encoding="UTF-8" ?><xfdf xmlns="http://ns.adobe.com/xfdf" xml:space="preserve"><square subject="Rectangle" page="0" name="cf4d2e58-e9c5-2a58-5b4d-9b4b1a330e45" title="user" creationdate="D:20120827112326-07'00'" date="D:20120827112326-07'00'" rect="227.7814207650273,597.6174863387978,437.07103825136608,705.0491803278688" color="#000000" interior-color="#FFFF00" flags="print" width="1"><popup flags="print,nozoom,norotate" open="no" page="0" rect="0,792,0,792" /></square></xfdf>`;

        const fdoc = await PDFNet.FDFDoc.createFromXFDF(str);
        in_doc.fdfMerge(fdoc);
        await in_doc.save(outputPath + 'numbered_modified.pdf', PDFNet.SDFDoc.SaveOptions.e_linearized);
        console.log('Merge complete.');

        // Extract XFDF as string
        console.log('Extract XFDF as a string.');

        const fdoc_new = await in_doc.fdfExtract(PDFNet.PDFDoc.ExtractFlag.e_both);
        const XFDF_str = await fdoc_new.saveAsXFDFAsString();
        console.log('Extracted XFDF: ');
        console.log(XFDF_str);
        console.log('Extract complete.');
      } catch (err) {
        console.log(err);
      }

      // Example 5) Read FDF files directly
      try {
        const doc = await PDFNet.FDFDoc.createFromFilePath(outputPath + 'form1_filled_data.fdf');

        for (const itr = await doc.getFieldIteratorBegin(); await itr.hasNext(); itr.next()) {
          const field = await itr.current();
          console.log('Field name: ' + await field.getName());
          console.log('Field partial name: ' + await field.getPartialName());

          console.log('------------------------------');
        }

        console.log('Done.');
      } catch (err) {
        console.log(err);
      }

      // Example 6) Direct generation of FDF.
      try  
      {
        const doc = await PDFNet.FDFDoc.create();
        // Create new fields (i.e. key/value pairs).
        doc.fieldCreateFromString('Company', PDFNet.Field.Type.e_text, 'PDFTron Systems');
        doc.fieldCreateFromString('First Name', PDFNet.Field.Type.e_text, 'John');
        doc.fieldCreateFromString('Last Name', PDFNet.Field.Type.e_text, 'Doe');
    
        await doc.save(outputPath + 'sample_output.fdf');
        console.log('Done. Results saved in sample_output.fdf');
      } catch (err) {
        console.log(err);
      }
    };

    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function (error) { console.log('Error: ' + JSON.stringify(error)); }).then(function () { PDFNet.shutdown(); });
  };
  exports.runFDFTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=FDFTest.js