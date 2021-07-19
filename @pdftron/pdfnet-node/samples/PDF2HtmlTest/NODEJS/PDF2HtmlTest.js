//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------
// The following sample illustrates how to use the PDF::Convert utility class to convert 
// documents and files to HTML.
//
// There are two HTML modules and one of them is an optional PDFNet Add-on.
// 1. The built-in HTML module is used to convert PDF documents to fixed-position HTML
//    documents.
// 2. The optional add-on module is used to convert PDF documents to HTML documents with
//    text flowing within paragraphs.
//
// The PDFTron SDK HTML add-on module can be downloaded from http://www.pdftron.com/
//
// Please contact us if you have any questions.	
//---------------------------------------------------------------------------------------

const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {
	'use strict';

	exports.runPDF2HtmlTest = () => {

		const main = async () => {

			const inputPath = '../../TestFiles/';
			const outputPath = '../../TestFiles/Output/';
			try {
				// Convert PDF document to HTML with fixed positioning option turned on (default)
				console.log('Converting PDF to HTML with fixed positioning option turned on (default)');

				const outputFile = outputPath + 'paragraphs_and_tables_fixed_positioning';

				// Convert PDF to HTML
				await PDFNet.Convert.fileToHtml(inputPath + 'paragraphs_and_tables.pdf', outputFile);

				console.log('Result saved in ' + outputFile);
			} catch (err) {
				console.log(err);
			}

			//////////////////////////////////////////////////////////////////////////

			await PDFNet.addResourceSearchPath('../../../lib/');

			if (!await PDFNet.PDF2HtmlReflowParagraphsModule.isModuleAvailable())
			{
				console.log('\nUnable to run part of the sample: PDFTron SDK HTML reflow paragraphs module not available.');
				console.log('---------------------------------------------------------------');
				console.log('The HTML reflow paragraphs module is an optional add-on, available for download');
				console.log('at http://www.pdftron.com/. If you have already downloaded this');
				console.log('module, ensure that the SDK is able to find the required files');
				console.log('using the PDFNet::AddResourceSearchPath() function.\n');

				return;
			}

			//////////////////////////////////////////////////////////////////////////

			try {
				// Convert PDF document to HTML with reflow paragraphs option turned on (1)
				console.log('Converting PDF to HTML with reflow paragraphs option turned on (1)');

				const outputFile = outputPath + 'paragraphs_and_tables_reflow_paragraphs.html';

				const htmlOutputOptions = new PDFNet.Convert.HTMLOutputOptions();

				// Set e_reflow_paragraphs content reflow setting
				htmlOutputOptions.setContentReflowSetting(PDFNet.Convert.HTMLOutputOptions.ContentReflowSetting.e_reflow_paragraphs);

				// Convert PDF to HTML
				await PDFNet.Convert.fileToHtml(inputPath + 'paragraphs_and_tables.pdf', outputFile, htmlOutputOptions);

				console.log('Result saved in ' + outputFile);
			} catch (err) {
				console.log(err);
			}

			//////////////////////////////////////////////////////////////////////////

			try {
				// Convert PDF document to HTML with reflow paragraphs option turned on (2)
				console.log('Converting PDF to HTML with reflow paragraphs option turned on (2)');

				const outputFile = outputPath + 'paragraphs_and_tables_reflow_paragraphs_no_page_width.html';

				const htmlOutputOptions = new PDFNet.Convert.HTMLOutputOptions();

				// Set e_reflow_paragraphs content reflow setting
				htmlOutputOptions.setContentReflowSetting(PDFNet.Convert.HTMLOutputOptions.ContentReflowSetting.e_reflow_paragraphs);

				// Set to flow paragraphs across the entire browser window.
				htmlOutputOptions.setNoPageWidth(true);

				// Convert PDF to HTML
				await PDFNet.Convert.fileToHtml(inputPath + 'paragraphs_and_tables.pdf', outputFile, htmlOutputOptions);

				console.log('Result saved in ' + outputFile);
			} catch (err) {
				console.log(err);
			}

			console.log('Done.');
		};
		// add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
		PDFNet.runWithCleanup(main).catch(function (error) {
			console.log('Error: ' + JSON.stringify(error));
		}).then(function () { PDFNet.shutdown(); });
	};
	exports.runPDF2HtmlTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=PDF2HtmlTest.js
