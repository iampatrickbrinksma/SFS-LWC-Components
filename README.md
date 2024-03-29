# Lightning Web Components

The intention of this repository is to share some useful Lightning Web Components for the Salesforce Field Service mobile app.

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
