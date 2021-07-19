//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------
// The following sample illustrates how to convert AdvancedImaging documents to PDF format 
// 
// The AdvancedImaging module is an optional PDFNet Add-on that can be used to convert AdvancedImaging
// documents into PDF documents
//
// The PDFTron SDK AdvancedImaging module can be downloaded from http://www.pdftron.com/
//---------------------------------------------------------------------------------------

const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {
	'use strict';

	exports.runAdvancedImagingTest = () => {

		const main = async () => {

			try {
				await PDFNet.addResourceSearchPath('../../../lib/');

				if (!await PDFNet.AdvancedImagingModule.isModuleAvailable()) {
					console.log('\nUnable to run AdvancedImagingTest: PDFTron SDK AdvancedImaging module not available.');
					console.log('---------------------------------------------------------------');
					console.log('The AdvancedImaging module is an optional add-on, available for download');
					console.log('at http://www.pdftron.com/. If you have already downloaded this');
					console.log('module, ensure that the SDK is able to find the required files');
					console.log('using the PDFNet::AddResourceSearchPath() function.\n');

					return;
				}

				// Relative path to the folder containing test files.
				const inputPath = '../../TestFiles/AdvancedImaging/';
				const outputPath = '../../TestFiles/Output/';

				const input_file_name = 'xray.dcm';
				const output_file_name = 'xray.pdf';

				const doc = await PDFNet.PDFDoc.create();
				doc.initSecurityHandler();

				const opts = new PDFNet.Convert.AdvancedImagingConvertOptions();
				opts.setDefaultDPI(72);
				await PDFNet.Convert.fromDICOM(doc, inputPath + input_file_name, opts);
				await doc.save(outputPath + output_file_name, PDFNet.SDFDoc.SaveOptions.e_linearized);
			} catch (err) {
				console.log(err);
			}
		};
		// add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
		PDFNet.runWithCleanup(main).catch(function (error) {
			console.log('Error: ' + JSON.stringify(error));
		}).then(function () { PDFNet.shutdown(); });
	};
	exports.runAdvancedImagingTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=AdvancedImagingTest.js
