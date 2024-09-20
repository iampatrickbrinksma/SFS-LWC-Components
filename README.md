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

# Object Details
The `getObjectInfo` wire adapter from the `lightning/uiObjectInfoApi` module can be used to read the metadata information from a SObject to determine what Record Types are accessible for the user, or if a field is updatable, etc. It can also be used to make sure the SObject metadata is primed and available for offline scenarios. This LWC component provides an easy way to view and navigate the `getObjectInfo` results.

Screenshot:

![image](https://github.com/user-attachments/assets/da838bb0-62a2-4c85-87b7-3b697627e488)

# Prime Custom Metadata Types
Custom Metadata Types are a great way to define custom application metadata which is customizable, deployable, packageable, and upgradeable. Currently (Winter '25) it is not possible to prime Custom Metadata Types for offline scenarios using the Briefcase Builder nor GraphQL in a Lightning Web Component. However, by using an Apex wire it is possible to prime Custom Metadata Types for offline use.

The following components are part of this example:
* Custom Metadata Type: `SFS_Mobile_Setting__mdt`
  * Custom Metadata Type records: 
    * `SFS_Mobile_Setting.Setting_1`
    * `SFS_Mobile_Setting.Setting_2`
    * `SFS_Mobile_Setting.Setting_3`
    * `SFS_Mobile_Setting.Setting_4`
    * `SFS_Mobile_Setting.Setting_5`
* Apex Class: `CustomMetadataTypeUtil`
* Lightning Web Component: `primeCustomMetadata`
* Global Action: `Settings_Primer`
* Permission Set: `Field_Service_Custom_Metadata_Type_Primer`

Deploy these components, assign your SFS mobile user the Permission Set and add the Global Action to the appropriate Publisher Layout.
Clear the metadata cache in the SFS mobile app, and when you open the Global Action, you should see something like:

![image](https://github.com/user-attachments/assets/a18d5f22-8a9b-4375-b9b5-ea811ffd3ed9)

This data is also available for offline use, as the SFS mobile app will prime the data via the Apex wire, and store it in the local cache.
# Deep Link Urls with Signature
When using Deep Linking to navigate from an external app, or from within the app, to the Field Service mobile app certain deep link urls need to be signed in order for the security dialogue to be suppressed, see help doc: https://developer.salesforce.com/docs/atlas.en-us.field_service_dev.meta/field_service_dev/fsl_dev_mobile_deep_linking_hide_security_dialog.htm.
This example shows how to generate the signature in Apex for links that are "static" in nature, meaning they just rely on the Salesforce record Id and not dynamic parameters. The example includes an Apex class with a method to generate the deep link urls for a record and store them in a custom field, and a Lightning Web Component to use it in the mobile app. 

The folowing components are part of this example:
* Apex Class: `DeepLinkUrl`
* Lightning Web `Component: recordDeepLinks`
* Custom Field: `ServiceAppointment.Deeplink_Url__c`
* Quick Action: `ServiceAppointment.Deep_Link_Urls`
* Permission Set: `Field_Service_Deep_Linking_Permissions`

Deploy these components, add the Quick Action to the assigned Page Layout for Service Appointment and assign the Permission Set to your user and the user of the mobile app. Then update the custom field on a Service Appointment record like:
```
// List of Quick Actions for which you want to generate a deep link url with signature
List<DeepLinkUtil.deepLinkAction> quickActions = new List<DeepLinkUtil.deepLinkAction>{
    new DeepLinkUtil.deepLinkAction( 'Deep_Link_Urls', 'Deep Link Urls', true )
};
Id saId = '<Service Appointment Record Id>';
ServiceAppointment sa = [select Id, Deeplink_Url__c from ServiceAppointment where Id = :saId];
sa.Deeplink_Url__c = JSON.serialize( DeepLinkUtil.createDeepLinkUrls( sa.Id, quickActions ) );
update sa;
```

Then open the mobile app, navigate to the service appointment and open the `Deep Link Urls` action and test the deep linking.

# Web Storage API
The `Web Storage API` (https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) allows you to store key / value pairs in the browser storage. This can be useful when developing LWCs for the SFS mobile app. The `webStorage` LWC is a class that enables the use of the Web Storage API, and the `webStorageAPI` component is an example of the use of this class. 
It's important to understand the difference between the storage types supported, which are:
  * `sessionStorage` - Stores data as part of when the SFS mobile app is open. When it's force closed, or closed by the mobile operating system, the storage is lost.
  * `localStorage` - Stores data persistently and is available until it is cleared or the user logs out.

To use this LWC, create a Global Action referncing the LWC and add it to the appropriate Publish Layout or create an object specific Action and add it to the appropriate Layout. Make sure you deploy the following LWCs: 
* webStorage
* webStorageAPI
* debugPanel

## Important
* The Web Storage API is NOT a replacement for the normal data storage in Salesforce objects
* The storage is not encrypted at rest by the SFS mobile app
* It is recommended to use this only in specific use cases whereby the state of an LWC needs to be restored

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

