//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------
// The following sample illustrates how to use the PDF::Convert utility class to convert 
// documents and files to Word.
//
// The Word module is an optional PDFNet Add-on that can be used to convert PDF
// documents into Word documents.
//
// The PDFTron SDK Word module can be downloaded from http://www.pdftron.com/
//
// Please contact us if you have any questions.	
//---------------------------------------------------------------------------------------

const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {
	'use strict';

	exports.runPDF2WordTest = () => {

		const main = async () => {

			await PDFNet.addResourceSearchPath('../../../lib/');

			if (!await PDFNet.PDF2WordModule.isModuleAvailable())
			{
				console.log('\nUnable to run the sample: PDFTron SDK Word module not available.');
				console.log('---------------------------------------------------------------');
				console.log('The Word module is an optional add-on, available for download');
				console.log('at http://www.pdftron.com/. If you have already downloaded this');
				console.log('module, ensure that the SDK is able to find the required files');
				console.log('using the PDFNet::AddResourceSearchPath() function.\n');

				return;
			}

			const inputPath = '../../TestFiles/';
			const outputPath = '../../TestFiles/Output/';
			try {
				// Convert PDF document to Word
				console.log('Converting PDF to Word');

				const outputFile = outputPath + 'paragraphs_and_tables.docx';

				await PDFNet.Convert.fileToWord(inputPath + 'paragraphs_and_tables.pdf', outputFile);

				console.log('Result saved in ' + outputFile);
			} catch (err) {
				console.log(err);
			}

			try {
				// Convert PDF document to Word with options
				console.log('Converting PDF to Word with options');

				const outputFile = outputPath + 'paragraphs_and_tables_first_page.docx';

				const wordOutputOptions = new PDFNet.Convert.WordOutputOptions();

				// Convert only the first page
				wordOutputOptions.setPages(1, 1);

				await PDFNet.Convert.fileToWord(inputPath + 'paragraphs_and_tables.pdf', outputFile, wordOutputOptions);

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
	exports.runPDF2WordTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=PDF2WordTest.js
