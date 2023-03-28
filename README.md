# Lightning Web Components

The intention of this repository is to share some useful Lightning Web Components.

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
