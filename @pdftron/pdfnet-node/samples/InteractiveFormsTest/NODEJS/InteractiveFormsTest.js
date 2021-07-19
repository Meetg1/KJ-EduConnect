//---------------------------------------------------------------------------------------
// Copyright (c) 2001-2021 by PDFTron Systems Inc. All Rights Reserved.
// Consult legal.txt regarding legal and license information.
//---------------------------------------------------------------------------------------

//---------------------------------------------------------------------------------------
// This sample illustrates basic PDFNet capabilities related to interactive 
// forms (also known as AcroForms). 
//---------------------------------------------------------------------------------------
const { PDFNet } = require('../../../lib/pdfnet.js');

((exports) => {
  'use strict';

  exports.runInteractiveFormsTest = () => {

    // field_nums has to be greater than 0.
    const RenameAllFields = async (doc, name, field_nums = 1) => {
      let itr = await doc.getFieldIterator(name);
      for (let counter = 0; (await itr.hasNext()); itr = (await doc.getFieldIterator(name)), ++counter) {
        const f = await itr.current();
        const update_count = Math.ceil(counter / field_nums);
        f.rename(name + update_count);
      }
    };

    const CreateCustomButtonAppearance = async (doc, buttonDown) => {
      // Create a button appearance stream ------------------------------------

      const builder = await PDFNet.ElementBuilder.create();
      const writer = await PDFNet.ElementWriter.create();
      writer.begin(doc);

      // Draw background
      let element = await builder.createRect(0, 0, 101, 37);
      element.setPathFill(true);
      element.setPathStroke(false);

      let elementGState = await element.getGState();
      elementGState.setFillColorSpace(await PDFNet.ColorSpace.createDeviceGray());
      elementGState.setFillColorWithColorPt(await PDFNet.ColorPt.init(0.75));
      writer.writeElement(element);

      // Draw 'Submit' text
      writer.writeElement((await builder.createTextBegin()));

      const text = 'Submit';
      const helveticaBoldFont = await PDFNet.Font.create(doc, PDFNet.Font.StandardType1Font.e_helvetica_bold);
      element = await builder.createTextRunWithSize(text, text.length, helveticaBoldFont, 12);
      elementGState = await element.getGState();
      elementGState.setFillColorWithColorPt((await PDFNet.ColorPt.init(0)));

      if (buttonDown) {
        element.setTextMatrixEntries(1, 0, 0, 1, 33, 10);
      } else {
        element.setTextMatrixEntries(1, 0, 0, 1, 30, 13);
      }
      writer.writeElement(element);

      writer.writeElement((await builder.createTextEnd()));

      const stm = await writer.end();

      // Set the bounding box
      await stm.putRect('BBox', 0, 0, 101, 37);
      await stm.putName('Subtype', 'Form');
      return stm;
    };

    const main = async () => {
      const outputPath = '../../TestFiles/Output/';

      //----------------------------------------------------------------------------------
      // Example 1: Programatically create new Form Fields and Widget Annotations.
      //----------------------------------------------------------------------------------
      try {
        const doc = await PDFNet.PDFDoc.create();
        doc.initSecurityHandler();

        // Create a blank new page and add some form fields.
        const blankPage = await doc.pageCreate();

        // Text Widget Creation 
        // Create an empty text widget with black text..
        const text1 = await PDFNet.TextWidget.create(doc, await PDFNet.Rect.init(110, 700, 380, 730));
        text1.setText('Basic Text Field');
        await text1.refreshAppearance();
        blankPage.annotPushBack(text1);
        // Create a vertical text widget with blue text and a yellow background.
        const text2 = await PDFNet.TextWidget.create(doc, await PDFNet.Rect.init(50, 400, 90, 730));
        text2.setRotation(90);
        // Set the text content.
        text2.setText('    ****Lucky Stars!****');
        // Set the font type, text color, font size, border color and background color.
        text2.setFont(await PDFNet.Font.create(doc, PDFNet.Font.StandardType1Font.e_helvetica_oblique));
        text2.setFontSize(28);
        text2.setTextColor(await PDFNet.ColorPt.init(0, 0, 1), 3);
        text2.setBorderColor(await PDFNet.ColorPt.init(0, 0, 0), 3);
        text2.setBackgroundColor(await PDFNet.ColorPt.init(1, 1, 0), 3);
        await text2.refreshAppearance();
        // Add the annotation to the page.
        blankPage.annotPushBack(text2);
        // Create two new text widget with Field names employee.name.first and employee.name.last
        // This logic shows how these widgets can be created using either a field name string or
        // a Field object
        const text3 = await PDFNet.TextWidget.create(doc, await PDFNet.Rect.init(110, 660, 380, 690), 'employee.name.first');
        text3.setText('Levi');
        text3.setFont(await PDFNet.Font.create(doc, PDFNet.Font.StandardType1Font.e_times_bold));
        await text3.refreshAppearance();
        blankPage.annotPushBack(text3);
        const empLastName = await doc.fieldCreateFromStrings('employee.name.last', PDFNet.Field.Type.e_text, 'Ackerman');
        const text4 = await PDFNet.TextWidget.createWithField(doc, await PDFNet.Rect.init(110, 620, 380, 650), empLastName);
        text4.setFont(await PDFNet.Font.create(doc, PDFNet.Font.StandardType1Font.e_times_bold));
        await text4.refreshAppearance();
        blankPage.annotPushBack(text4);

        // Signature Widget Creation (unsigned)
        const signature1 = await PDFNet.SignatureWidget.create(doc, await PDFNet.Rect.init(110, 560, 260, 610));
        await signature1.refreshAppearance();
        blankPage.annotPushBack(signature1);

        // CheckBox Widget Creation
        // Create a check box widget that is not checked.
        const check1 = await PDFNet.CheckBoxWidget.create(doc, await PDFNet.Rect.init(140, 490, 170, 520));
        await check1.refreshAppearance();
        blankPage.annotPushBack(check1);
        // Create a check box widget that is checked.
        const check2 = await PDFNet.CheckBoxWidget.create(doc, await PDFNet.Rect.init(190, 490, 250, 540), 'employee.name.check1');
        check2.setBackgroundColor(await PDFNet.ColorPt.init(1, 1, 1), 3);
        check2.setBorderColor(await PDFNet.ColorPt.init(0, 0, 0), 3);
        // Check the widget (by default it is unchecked).
        check2.setChecked(true);
        await check2.refreshAppearance();
        blankPage.annotPushBack(check2);

        // PushButton Widget Creation
        const pushbutton1 = await PDFNet.PushButtonWidget.create(doc, await PDFNet.Rect.init(380, 490, 520, 540));
        pushbutton1.setTextColor(await PDFNet.ColorPt.init(1, 1, 1), 3);
        pushbutton1.setFontSize(36);
        pushbutton1.setBackgroundColor(await PDFNet.ColorPt.init(0, 0, 0), 3);
        // Add a caption for the pushbutton.
        pushbutton1.setStaticCaptionText('PushButton');
        await pushbutton1.refreshAppearance();
        blankPage.annotPushBack(pushbutton1);

        // ComboBox Widget Creation
        const combo1 = await PDFNet.ComboBoxWidget.create(doc, await PDFNet.Rect.init(280, 560, 580, 610));
        // Add options to the combobox widget.
        combo1.addOption('Combo Box No.1');
        combo1.addOption('Combo Box No.2');
        combo1.addOption('Combo Box No.3');
        // Make one of the options in the combo box selected by default.
        combo1.setSelectedOption('Combo Box No.2');
        combo1.setTextColor(await PDFNet.ColorPt.init(1, 0, 0), 3);
        combo1.setFontSize(28);
        await combo1.refreshAppearance();
        blankPage.annotPushBack(combo1);

        // ListBox Widget Creation
        const list1 = await PDFNet.ListBoxWidget.create(doc, await PDFNet.Rect.init(400, 620, 580, 730));
        // Add one option to the listbox widget.
        list1.addOption('List Box No.1');
        // Add multiple options to the listbox widget in a batch.
        const list_options = ['List Box No.2', 'List Box No.3'];
        list1.addOptions(list_options);
        // Select some of the options in list box as default options
        list1.setSelectedOptions(list_options);
        // Enable list box to have multi-select when editing. 
        await (await list1.getField()).setFlag(PDFNet.Field.Flag.e_multiselect, true);
        list1.setFont(await PDFNet.Font.create(doc, PDFNet.Font.StandardType1Font.e_times_italic));
        list1.setTextColor(await PDFNet.ColorPt.init(1, 0, 0), 3);
        list1.setFontSize(28);
        list1.setBackgroundColor(await PDFNet.ColorPt.init(1, 1, 1), 3);
        await list1.refreshAppearance();
        await blankPage.annotPushBack(list1);

        // RadioButton Widget Creation
        // Create a radio button group and add three radio buttons in it. 
        const radio_group = await PDFNet.RadioButtonGroup.create(doc, 'RadioGroup');
        const radiobutton1 = await radio_group.add(await PDFNet.Rect.init(140, 410, 190, 460));
        radiobutton1.setBackgroundColor(await PDFNet.ColorPt.init(1, 1, 0), 3);
        await radiobutton1.refreshAppearance();
        const radiobutton2 = await radio_group.add(await PDFNet.Rect.init(310, 410, 360, 460));
        radiobutton2.setBackgroundColor(await PDFNet.ColorPt.init(0, 1, 0), 3);
        await radiobutton2.refreshAppearance();
        const radiobutton3 = await radio_group.add(await PDFNet.Rect.init(480, 410, 530, 460));
        // Enable the third radio button. By default the first one is selected
        radiobutton3.enableButton();
        radiobutton3.setBackgroundColor(await PDFNet.ColorPt.init(0, 1, 1), 3);
        await radiobutton3.refreshAppearance();
        await radio_group.addGroupButtonsToPage(blankPage);

        // Custom push button annotation creation
        const custom_pushbutton1 = await PDFNet.PushButtonWidget.create(doc, await PDFNet.Rect.init(260, 320, 360, 360));
        // Set the annotation appearance.
        custom_pushbutton1.setAppearance(await CreateCustomButtonAppearance(doc, false), PDFNet.Annot.State.e_normal);
        // Create 'SubmitForm' action. The action will be linked to the button.
        const url = await PDFNet.FileSpec.createURL(doc, 'http://www.pdftron.com');
        const button_action = await PDFNet.Action.createSubmitForm(url);
        // Associate the above action with 'Down' event in annotations action dictionary.
        const annot_action = await (await custom_pushbutton1.getSDFObj()).putDict('AA');
        await annot_action.put('D', await button_action.getSDFObj());
        await blankPage.annotPushBack(custom_pushbutton1);

        // Add the page as the last page in the document.
        doc.pagePushBack(blankPage);
        // If you are not satisfied with the look of default auto-generated appearance 
        // streams you can delete "AP" entry from the Widget annotation and set 
        // "NeedAppearances" flag in AcroForm dictionary:
        //    doc.GetAcroForm().PutBool("NeedAppearances", true);
        // This will force the viewer application to auto-generate new appearance streams 
        // every time the document is opened.
        //
        // Alternatively you can generate custom annotation appearance using ElementWriter 
        // and then set the "AP" entry in the widget dictionary to the new appearance
        // stream.
        //
        // Yet another option is to pre-populate field entries with dummy text. When 
        // you edit the field values using PDFNet the new field appearances will match 
        // the old ones.

        //doc.GetAcroForm().PutBool("NeedAppearances", true);
        // NOTE: RefreshFieldAppearances will replace previously generated appearance streams

        doc.refreshFieldAppearances();

        await doc.save(outputPath + 'forms_test1.pdf', 0);

        console.log('Done.');
      } catch (err) {
        console.log(err.stack);
      }

      //----------------------------------------------------------------------------------
      // Example 2:
      // Fill-in forms / Modify values of existing fields.
      // Traverse all form fields in the document (and print out their names).
      // Search for specific fields in the document.
      //----------------------------------------------------------------------------------

      // This is used later on to clone the fields
      const field_names = {};
      try {
        const doc = await PDFNet.PDFDoc.createFromFilePath(outputPath + 'forms_test1.pdf');
        doc.initSecurityHandler();

        const itr = await doc.getFieldIteratorBegin();
        for (; (await itr.hasNext()); itr.next()) {
          const currentItr = await itr.current();
          const curFieldName = await currentItr.getName();

          // Add one to the count for this field name for later processing
          field_names[curFieldName] = (curFieldName in field_names ? field_names[curFieldName] + 1 : 1);

          console.log('Field name: ' + curFieldName);
          console.log('Field partial name: ' + (await currentItr.getPartialName()));

          const typeStr = 'Field type: ';
          const type = await currentItr.getType();
          const strVal = await currentItr.getValueAsString();

          switch (type) {
            case PDFNet.Field.Type.e_button:
              console.log(typeStr + 'Button');
              break;
            case PDFNet.Field.Type.e_radio:
              console.log(typeStr + 'Radio button: Value = ' + strVal);
              break;
            case PDFNet.Field.Type.e_check:
              currentItr.setValueAsBool(true);
              console.log(typeStr + 'Check box: Value = ' + strVal);
              break;
            case PDFNet.Field.Type.e_text:
              console.log(typeStr + 'Text');
              // Edit all variable text in the document
              currentItr.setValueAsString('This is a new value. The old one was: ' + strVal);
              break;
            case PDFNet.Field.Type.e_choice:
              console.log(typeStr + 'Choice');
              break;
            case PDFNet.Field.Type.e_signature:
              console.log(typeStr + 'Signature');
              break;
          }
          console.log('------------------------------');
        }
        const f = await doc.getField('employee.name.first');
        if (f) {
          console.log('Field search for ' + (await f.getName()) + ' was successful');
        } else {
          console.log('Field search failed');
        }
        // Regenerate field appearances.
        doc.refreshFieldAppearances();

        await doc.save(outputPath + 'forms_test_edit.pdf', 0);
        console.log('Done.');
      } catch (err) {
        console.log(err);
      }
      //----------------------------------------------------------------------------------
      // Sample 3: Form templating
      // Replicate pages and form data within a document. Then rename field names to make
      // them unique.
      //----------------------------------------------------------------------------------
      try {
        const doc = await PDFNet.PDFDoc.createFromFilePath(outputPath + 'forms_test1.pdf');
        doc.initSecurityHandler();

        const srcPage = await doc.getPage(1);
        doc.pagePushBack(srcPage); // Append several copies of the first page
        doc.pagePushBack(srcPage); // Note that forms are successfully copied
        doc.pagePushBack(srcPage);
        doc.pagePushBack(srcPage);

        // Now we rename fields in order to make every field unique.
        // You can use this technique for dynamic template filling where you have a 'master'
        // form page that should be replicated, but with unique field names on every page.
        for (const fieldName in field_names) {
          await RenameAllFields(doc, fieldName, field_names[fieldName]);
        }

        await doc.save(outputPath + 'forms_test1_cloned.pdf', 0);
        console.log('Done.');
      } catch (err) {
        console.log(err);
      }

      //----------------------------------------------------------------------------------
      // Sample:
      // Flatten all form fields in a document.
      // Note that this sample is intended to show that it is possible to flatten
      // individual fields. PDFNet provides a utility function PDFDoc.FlattenAnnotations()
      // that will automatically flatten all fields.
      //----------------------------------------------------------------------------------

      try {
        const doc = await PDFNet.PDFDoc.createFromFilePath(outputPath + 'forms_test1.pdf');
        doc.initSecurityHandler();

        // Flatten all pages
        // eslint-disable-next-line no-constant-condition
        if (true) {
          doc.flattenAnnotations();
        } else {
          // Manual flattening
          for (let pitr = await doc.getPageIterator(); (await pitr.hasNext()); (await pitr.next())) {
            const page = await pitr.current();
            const annots = await page.getAnnots();

            if (annots) { // Look for all widget annotations (in reverse order)
              for (let i = parseInt(await annots.size(), 10) - 1; i >= 0; --i) {
                const annotObj = await annots.getAt(i);
                const annotObjSubtype = await annotObj.get('Subtype');
                // eslint-disable-next-line no-unused-vars
                const annotObjVal = await annotObjSubtype.value();
                const annotObjName = await annotObjVal.getName();

                if (annotObjName === 'Widget') {
                  const field = await PDFNet.Field.create(annotObj);
                  field.flatten(page);
                }
              }
            }
          }
        }

        await doc.save(outputPath + 'forms_test1_flattened.pdf', 0);
        console.log('Done.');
      } catch (err) {
        console.log(err);
      }
    };
    // add your own license key as the second parameter, e.g. PDFNet.runWithCleanup(main, 'YOUR_LICENSE_KEY')
    PDFNet.runWithCleanup(main).catch(function (error) {
      console.log('Error: ' + JSON.stringify(error));
    }).then(function () { PDFNet.shutdown(); });
  };
  exports.runInteractiveFormsTest();
})(exports);
// eslint-disable-next-line spaced-comment
//# sourceURL=InteractiveFormsTest.js