# Lightning Web Components for the Salesforce Field Service Mobile App
The intention of this repository is to share some useful Lightning Web Components for the Salesforce Field Service mobile app.

## Disclaimer

**Please do not log a support case with Salesforce support. If you encounter an issue or have a question, create a new issue in this repository!**

This repository contains code intended to help Salesforce Field Service customers and partners accelerate their implementations. Please note the following:
* This code is not an official Salesforce product.
* It is not officially supported by Salesforce.
* The code serves as an example of how to implement specific functionality or make use of certain features.

Before using this code in a production environment, it is crucial that you:
* Adopt the code to fit your specific needs.
* Test thoroughly to ensure it works as expected in your environment.
* Consider the code to be your own and take full responsibility for its use.

By using this code, you acknowledge that Salesforce is not liable for any issues that may arise from its use.

## Components Included In This Repository
* Prime Files for Offline Use
* Online of Offline
* Check In/Out
* File Upload Plus
* Object Details
* Prime Custom Metadata
* Generate Deep Link Urls with Signature
* Web Storage API
* Debug Panel

# Prime Files for Offline Use (scheduleFilePrimer)
This component downloads files related to Work Orders and Work Order Line Items which are parent records of the service appointments which make up the schedule of the service resource. Today (Winter '25), Salesforce Field Service does not have an out of the box feature to prime files for offline use. The user has to open a file for it to be available for offline use, which can be a cumbersome task for a service resource. The component is able to download any file due to the behavior of the underlying runtime engine that causes the app to download any file that is references in an IMG tag in the template. Additionally, all the details of the records of the `ContentDocumentLink`, `ContentDocument` and `ContentVersion` objects need to be primed as well to be able to view the files when the device is offline using the native file preview component.

Some screenshots:

<p float="left">
<img width="260" alt="image" src="https://github.com/user-attachments/assets/b243a8db-3fbc-4fda-b9b2-f8908380b943">
&nbsp;&nbsp;
<img width="260" alt="image" src="https://github.com/user-attachments/assets/f3d09f75-8aaf-4cba-a33b-e0f8efbea43d">
&nbsp;&nbsp;
<img width="260" alt="image" src="https://github.com/user-attachments/assets/0e663370-6b94-4d89-8cdd-83c9361b1c19">
</p>

The folowing components are part of this example:
* Lightning Web Component: `filePrimer`
* Lightning Web Component: `filePrimerConfig`
* Lightning Web Component: `filePrimerConfigBanner`
* Lightning Web Component: `recordFilePrimer`
* Lightning Web Component: `scheduleFilePrimer`

In order to use the component create a Lightning Web Component `Global Action` which uses the `scheduleFilePrimer` LWC and add it to the `Mobile & Lightning Actions` section on the `Publisher Layout` which is assigned to the profile of the mobile user. This allows the user to prime files related to the Work Orders and Work Order Line Items which are part of their schedule for the given number of days.

In order to allow the user to prime files related to a record, use the `recordFilePrimer` LWC, create the object specific `Quick Action` and add it to the `Mobile & Lightning Actions` section on the `Page Layout` which is assigned to the profile of the mobile user. 

To filter out files based on the file extension and/or file size, update the `FILEPRIMER_CONFIG` values in `filePrimerConfig.js` to reflect the appropriate filter.

## Important
* This component has not been thoroughly tested - especially not on Android! - and it is recommended to test it using a variety of files, file sizes and connectivity scenarios
* The maximum number of days to prime can be adjusted in the file `scheduleFilePrimer.js` and it is strongly recommended to keep this number as low as possible to match the business requirements
* Once the user logs out, the local cache of the mobile app related to that user is removed, so the files are also no longer cached
* In the LWC some files show a preview, which is a feature of the WebView in which the LWC runs. This is not a feature of LWC

# Online Or Offline (isOnlineOrOffline)
This component can detect if the LWC is online or offline. Today (Winter '25) there is no standard method in LWC to detect this. By using imperative Apex with a simple Apex method it can be derived if the LWC is online or offline. It is important to understand that the online and offline state is not detected automatically and it only works on demand.

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

**IMPORTANT:** In the Spring '25 release it's possible to provide read/edit permission for the `Last Known Location` field, but no edit permission for the `Last Known Location Date` field. Also not via the workaround described below. Therefor the component does NOT update the `Last Known Location Date` field anymore...

Note: This is NOT possible via the Profile or Permission Set in the Setup UI. However, you can grant Edit permission as following:
1. Navigate to Setup -> Object Manager -> Service Resource -> Fields & Relationships -> Last Known Location -> Set Field-Level Security and make sure the Visible option is checked for the Profile of the mobile user.
2. For the Last Known Location Date, update the URL of step 1 from `.../lightning/setup/ObjectManager/ServiceResource/FieldsAndRelationships/LastKnownLocation/edit...` to `.../lightning/setup/ObjectManager/ServiceResource/FieldsAndRelationships/LastKnownLocationDate/edit...`, so changing `LastKnownLocation` to `LastKnownLocationDate`

# File Upload Plus (fileUploadPlus)
Inspired by the example code in [the Saleforce documentation](https://developer.salesforce.com/docs/atlas.en-us.mobile_offline.meta/mobile_offline/use_images_upload_while_offline_example.htm) this component allows you to upload a single file (any file type) and populate a custom field define on the `ContentVersion` object. You can embed this component in another LWC and pass the record Id and custom field API Name, Label, field type (text and checkbox supported) and a default value. Additionally it dispatches a custom event on file upload and when the upload is canceled.

Important: You have to logout and login or clear metadata cache to obtain the metadata of the custom field defined on the `ContentVersion` object. This object does [not support field level permissions](https://help.salesforce.com/s/articleView?id=000380808&type=1), and any user will have access to the custom field.

An example of how to use the File Upload Plus component is shown in the ```attachFileToWorkOrder``` LWC, which uses the ```Internal_Only__c``` custom checkbox field on the ContentVersion object. Make sure to create/deploy that field in order to use this LWC. Add the LWC as an Action to the Work Order to expose it in the Field Service Mobile app.

# Object Details (objectDetails)
The `getObjectInfo` wire adapter from the `lightning/uiObjectInfoApi` module can be used to read the metadata information from a SObject to determine what Record Types are accessible for the user, or if a field is updatable, etc. It can also be used to make sure the SObject metadata is primed and available for offline scenarios. This LWC component provides an easy way to view and navigate the `getObjectInfo` results.

Screenshot:

![image](https://github.com/user-attachments/assets/da838bb0-62a2-4c85-87b7-3b697627e488)

Additionally, because a wire is used to call the Apex method, the results are cached locally and the data is available in offline scenarios.

# Prime Custom Metadata Types (primeCustomMetadata)
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

This data is also available for offline use, as the SFS mobile app will prime the data via the Apex wire, and store it in the local cache. This local cache is separate from the data cache and is immutable.

# Generate Deep Link Urls with Signature (recordDeepLinks)
When using Deep Linking to navigate from an external app, or from within the app, to the Field Service mobile app certain deep link urls need to be signed in order for the security dialogue to be suppressed, see help doc: https://developer.salesforce.com/docs/atlas.en-us.field_service_dev.meta/field_service_dev/fsl_dev_mobile_deep_linking_hide_security_dialog.htm.
This example shows how to generate the signature in Apex for links that are "static" in nature, meaning they just rely on the Salesforce record Id and not dynamic parameters. The example includes an Apex class with a method to generate the deep link urls for a record and store them in a custom field, and a Lightning Web Component to use it in the mobile app. 

The folowing components are part of this example:
* Apex Class: `DeepLinkUtil`
* Lightning Web Component: `recordDeepLinks`
* Custom Field: `ServiceAppointment.Deeplink_Url__c`
* Quick Action: `ServiceAppointment.Deep_Link_Urls`
* Quick Action: `WorkOrder.Deep_Link_Urls` (this one makes more sense due to more deep link options)
* Permission Set: `Field_Service_Deep_Linking_Permissions`

First step is to copy the public key from the `DeepLinkUtil` Apex Class (see the comments section in the class) - or generate a new public and private key following the instructions in the comments - to the Setup -> Field Service Settings -> Public Security Key field and save the changes.
Then deploy these components, add the Quick Action to the assigned Page Layout for Service Appointment and the one for Work Order and assign the Permission Set to your user and the user of the mobile app. Then update the custom field on a Service Appointment record like:
```
// List of Quick Actions for which you want to generate a deep link url with signature
List<DeepLinkUtil.deepLinkAction> quickActions = new List<DeepLinkUtil.deepLinkAction>{
    new DeepLinkUtil.deepLinkAction( 'Deep_Link_Urls', 'Deep Link Urls', true )
};
Id saId = '<Service Appointment Record Id>';
String deepLinkUrls = JSON.serialize( DeepLinkUtil.createDeepLinkUrls( sa.Id, quickActions ) );
update new ServiceAppointment(Id = saId, Deeplink_Url__c = deepLinkUrls);
```

To generate deep link urls for the standard actions, use:
```
Id saId = '<Service Appointment Record Id>';
String deepLinkUrls = JSON.serialize( DeepLinkUtil.createDeepLinkUrls( sa.Id ) );
update new ServiceAppointment(Id = saId, Deeplink_Url__c = deepLinkUrls);
```

Then open the mobile app, navigate to the service appointment and open the `Deep Link Urls` action and test the deep linking.

# Web Storage API (webStorageAPI)
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

# Debug Panel (debugPanel)
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

