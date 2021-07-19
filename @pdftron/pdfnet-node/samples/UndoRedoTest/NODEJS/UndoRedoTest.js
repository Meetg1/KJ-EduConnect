//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------
// The following sample illustrates how to use the UndoRedo API.
//---------------------------------------------------------------------------------------
const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {

	exports.runUndoRedoTest = () => {

		const main = async () => {
			try {
				// Relative path to the folder containing test files.
				const inputPath = '../../TestFiles/';
				const outputPath = inputPath + 'Output/';

				// Open the PDF document.
				const doc = await PDFNet.PDFDoc.createFromFilePath(inputPath + 'newsletter.pdf');

				const undo_manager = await doc.getUndoManager();

				// Take a snapshot to which we can undo after making changes.
				const snap0 = await undo_manager.takeSnapshot();

				const snap0_state = await snap0.currentState();

				const page = await doc.pageCreate();	// Start a new page

				const bld = await PDFNet.ElementBuilder.create();		// Used to build new Element objects
				const writer = await PDFNet.ElementWriter.create();	// Used to write Elements to the page	
				writer.beginOnPage(page);		// Begin writing to this page

				// ----------------------------------------------------------
				// Add JPEG image to the file
				const img = await PDFNet.Image.createFromFile(doc, inputPath + 'peppers.jpg');
				const element = await bld.createImageFromMatrix(img, await PDFNet.Matrix2D.create(200, 0, 0, 250, 50, 500));
				writer.writePlacedElement(element);

				await writer.end();	// Finish writing to the page
				await doc.pagePushFront(page);

				// Take a snapshot after making changes, so that we can redo later (after undoing first).
				const snap1 = await undo_manager.takeSnapshot();

				if (await (await snap1.previousState()).equals(snap0_state)) {
					console.log('snap1 previous state equals snap0_state; previous state is correct');
				}

				const snap1_state = await snap1.currentState();

				await doc.save(outputPath + 'addimage.pdf', PDFNet.SDFDoc.SaveOptions.e_incremental);

				if (await undo_manager.canUndo()) {
					const undo_snap = await undo_manager.undo();

					await doc.save(outputPath + 'addimage_undone.pdf', PDFNet.SDFDoc.SaveOptions.e_incremental);

					const undo_snap_state = await undo_snap.currentState();

					if (await undo_snap_state.equals(snap0_state)) {
						console.log('undo_snap_state equals snap0_state; undo was successful');
					}

					if (await undo_manager.canRedo()) {
						const redo_snap = await undo_manager.redo();

						await doc.save(outputPath + 'addimage_redone.pdf', PDFNet.SDFDoc.SaveOptions.e_incremental);

						if (await (await redo_snap.previousState()).equals(undo_snap_state)) {
							console.log('redo_snap previous state equals undo_snap_state; previous state is correct');
						}

						const redo_snap_state = await redo_snap.currentState();

						if (await redo_snap_state.equals(snap1_state)) {
							console.log('Snap1 and redo_snap are equal; redo was successful');
						}
					}
					else {
						console.log('Problem encountered - cannot redo.');
					}
				}
				else {
					console.log('Problem encountered - cannot undo.');
				}
			} catch (err) {
				console.log(err.stack);
			}
		};

		// add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
		PDFNet.runWithCleanup(main).catch(function (error) { console.log('Error: ' + JSON.stringify(error)); }).then(function () { PDFNet.shutdown(); });
	};
	exports.runUndoRedoTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=UndoRedoTest.js
