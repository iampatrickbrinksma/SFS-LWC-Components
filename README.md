# Lightning Web Components for the Salesforce Field Service Mobile App
The intention of this repository is to share some useful Lightning Web Components for the Salesforce Field Service mobile app.

## Disclaimer
IMPORTANT: This code is not intended to be deployed directly to a Salesforce production environment, but to be used as an example. This is not a Salesforce product and is not officially supported by Salesforce.

# Online Or Offline (isOnlineOrOffline)
This component can detect if the LWC is online or offline. Today (Spring '23 release) there is no standard method in LWC to detect this. By using imperative Apex with a simple Apex method it can be derived if the LWC is online or offline. It is important to understand that the online and offline state is not detected automatically and it only works on demand.

The parentComponent LWC has embedded this component to show how it can be used and how it behaves.

Screenshots below show the parentComponent with the embedded isOnlineOrOffline component:

<p float="left">
<img src="https://user-images.githubusercontent.com/78381570/228167375-33aab351-8365-4cba-acb0-d765fd26ab9d.png" width="30%" height="30%">
&nbsp;&nbsp;
<img src="https://user-images.githubusercontent.com/78381570/228167426-c25b749f-5694-4c31-91ef-a5215b5d2856.png" width="30%" height="30%">
</p>

Tap the "Check If Online" button to request an update on the online status.

# Check In/Out (checkInOut)
This component provides functionality to check in / out of work. The component shows a map of the current location, and it shows the location of any not completed appointment for today on that map. If the user checks in or out, two fields on the service resource record, `Checked_In_Out__c` (Boolean) and `Checked_In_Out_Date__c` (Datetime), are updated to reflect if the user is checked in our out. The component uses the `lightning/uiGraphQLApi` wire adapters and functions to query for the service resource and assigned service appointment records. To obtain the current location it uses the `getLocationService()` from `lightning/mobileCapabilities`.

You can add this component via a Global or Record Action which invokes this LWC. Or you can use the Field Service Mobile App builder to add it as a navigation item. 

## Important
In order for the user to be able to have the right permissions, make sure to do the following:
1. Assign the `Field Service Check In Out Permissions` permission set to the user
2. Grant Edit permission to the following fields on the Service Resource object:
  - Last Known Location
  - Last Known Location Date

Note: This is NOT possible via the Profile or Permission Set in the Setup UI. However, you can grant Edit permission as following:
1. Navigate to Setup -> Object Manager -> Service Resource -> Fields & Relationships -> Last Known Location -> Set Field-Level Security and make sure the Visible option is checked for the Profile of the mobile user.
2. For the Last Known Location Date, update the URL of step 1 from `.../lightning/setup/ObjectManager/ServiceResource/FieldsAndRelationships/LastKnownLocation/edit...` to `.../lightning/setup/ObjectManager/ServiceResource/FieldsAndRelationships/LastKnownLocationDate/edit...`, so changing `LastKnownLocation` to `LastKnownLocationDate`

# File Upload Plus
Inspired by the example code in [the Saleforce documentation](https://developer.salesforce.com/docs/atlas.en-us.mobile_offline.meta/mobile_offline/use_images_upload_while_offline_example.htm) this component allows you to upload a single file (any file type) and populate a custom field define on the `ContentVersion` object. You can embed this component in another LWC and pass the record Id and custom field API Name, Label, field type (text and checkbox supported) and a default value. Additionally it dispatches a custom event on file upload and when the upload is canceled.

Important: You have to logout and login or clear metadata cache to obtain the metadata of the custom field defined on the `ContentVersion` object. This object does [not support field level permissions](https://help.salesforce.com/s/articleView?id=000380808&type=1), and any user will have access to the custom field.

An example of how to use the File Upload Plus component is shown in the ```attachFileToWorkOrder``` LWC, which uses the ```Internal_Only__c``` custom checkbox field on the ContentVersion object. Make sure to create/deploy that field in order to use this LWC. Add the LWC as an Action to the Work Order to expose it in the Field Service Mobile app.

# Debug Panel
It can be challenging to debug your Lightning Web Component while running it in the Salesforce Field Service mobile app. This Debug Panel component provides an easy way to write debugging information into a text area with timestamps added. The panel allows you to copy the text to the clipboard and clear the output.

Example of how it looks embedded in an LWC:

<img src="https://github.com/iampatrickbrinksma/SFS-LWC-Components/assets/78381570/a15694dc-0739-4699-b249-f95c6be77202.png" width="30%" height="30%">


To include this component in your LWC, add the following to the js controller:
```
// Log to console and add to output
  // Log msg
  log( msg, consoleOnly ) {
      let debugPanel = this.template.querySelector( "c-debug-panel");
      if ( debugPanel ) {
          debugPanel.log( msg, consoleOnly );
      } else {
          console.log( msg );
      }
  } 
```
And the following to the HTML template:
```
<c-debug-panel write-to-console="true"></c-debug-panel>
```
Set the writeToConsole to false if you don't want the output written to the console.

To write a message to the debug panel, just call the log function:
```
this.log( `Add this message to the debug panel and include this JSON object: ${ JSON.stringify( jsonObject ) } );
```
