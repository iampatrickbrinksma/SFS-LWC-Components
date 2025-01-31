import { LightningElement, wire } from 'lwc';
// Confirm
import LightningConfirm from 'lightning/confirm';
// UI API
import { updateRecord } from "lightning/uiRecordApi";
// GraphQL support
import { gql, graphql, refreshGraphQL } from "lightning/uiGraphQLApi";
// User Id
import currentUserId from "@salesforce/user/Id";
// Timezone
import timeZone from '@salesforce/i18n/timeZone';
// Geolocation
import { getLocationService } from 'lightning/mobileCapabilities';
// Data model
import FLD_CHECKEDINOUT from "@salesforce/schema/ServiceResource.Checked_In_Out__c";
import FLD_CHECKEDDATE from "@salesforce/schema/ServiceResource.Checked_In_Out_Date__c";
import FLD_LASTKNOWNLAT from "@salesforce/schema/ServiceResource.LastKnownLatitude";
import FLD_LASTKNOWNLNG from "@salesforce/schema/ServiceResource.LastKnownLongitude";
//import FLD_LASTKNOWNDT from "@salesforce/schema/ServiceResource.LastKnownLocationDate";
import FLD_INJEOPARDY from "@salesforce/schema/ServiceAppointment.FSL__InJeopardy__c";
import FLD_INJEOPARDYREASON from "@salesforce/schema/ServiceAppointment.FSL__InJeopardyReason__c";
// Helpers
import constants from "./constants";
import { reduceErrors } from "./errors";

export default class CheckInOut extends LightningElement {

    // Constant values for labels, etc
    CONSTANTS = constants;

    // Indicator to show overlay with spinner
    showSpinner = false;

    // Default values for button label and variant
    btnLabel = this.CONSTANTS.RETRIEVINGSTATUS;
    btnVariant = this.CONSTANTS.BTNBRAND;

    // Checked In/Out status
    _isCheckingInOut = false;
    _isCheckedIn;
    checkedInOutValue = '';
    checkInOutTxt = '';
    checkedDate;
    checkedBadgeCls = '';
    showCheckInOut = true;

    // User data
    userId = currentUserId;
    userTimeZone = timeZone;

    // Data for Service Resource graphQL query
    srResult;
    srId;
    srName;
    
    // Data for Service Appointment graphQL Query
    saResult;
    _sas = [];
    saCount = 0;

    // Geolocation
    myLocationService;
    currentLocation;
    locationEnabled;
    _locationMarkers;
    sasWithLocation = false;

    // Timer for auto-closing
    _timeInterval;

    // Error handling
    errorMsgs;

    // Debug
    showOutput = true;
    output = '';

    connectedCallback(){
        // Determine if LocationService API is available
        // and if so, get current location
        this.myLocationService = getLocationService();
        if (this.myLocationService == null || !this.myLocationService.isAvailable()) {
            this.addOutput(this.CONSTANTS.LOCSRVNOTAVAILABLE);
            this.locationEnabled = false;
        } else {
            this.locationEnabled = true;
            this.getCurrentLocation();
        }
    }
    
    disconnectedCallback(){
        window.clearInterval(this._timeInterval);
    }

    // Wire for Service Resource data
    @wire(graphql, {
        query: gql`
            query ServiceResourceQry($thisUserId: ID) {
                uiapi {
                    query {
                        ServiceResource(where: { RelatedRecordId: { eq: $thisUserId } } ) {
                            edges {
                                node {
                                    Id
                                    Checked_In_Out__c {
                                        value
                                        displayValue
                                    }
                                    Checked_In_Out_Date__c {
                                        value
                                    }
                                    RelatedRecord {
                                        Name {
                                            value
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }            
        `, 
        variables: "$srQueryVars",
    })
    SRQueryResults( result ) {
        if (this._isCheckingInOut) return;
        this.addOutput('SRQueryResults');
        const { data, errors } = result;
        if (data){
            let srs = data.uiapi.query.ServiceResource.edges.map((edges) => edges.node);
            this.srId = srs[0].Id;
            this.srName = srs[0].RelatedRecord.Name.value;
            this.checkedInOutValue = srs[0].Checked_In_Out__c.value;
            this.checkedDate = srs[0].Checked_In_Out_Date__c.value;

            this._isCheckedIn = this.checkedInOutValue === this.CONSTANTS.CHECKEDIN ? true : false;

            this.setCheckedContext();
        }
        if (errors){
            this.handleError('SRQueryResults', errors);
        }
        this.srResult = result;
    }

    // Variable for the graphQL query
    get srQueryVars(){
        return {
            thisUserId: this.userId
        };
    }    

    // Wire for Service Appointment data
    @wire(graphql, {
        query: gql`
            query ServiceAppointmentQry($startOfDay: DateTime, $endOfDay: DateTime) {
                uiapi {
                    query {
                        ServiceAppointment(where: { 
                            and: [
                                { or: [
                                    { and: [
                                        { SchedEndTime: { gte: { value: $startOfDay } } },
                                        { SchedEndTime: { lte: { value: $endOfDay } } }   
                                    ] },
                                    { and: [
                                        { SchedStartTime: { lt: { value: $endOfDay } } }, 
                                        { SchedEndTime: { gt: { value: $endOfDay } } }    
                                    ] }
                                ] },
                                { StatusCategory: { nin: [ "Canceled", "Cannot Complete", "Completed" ] } } 
                            ] } ) {
                            edges {
                                node {
                                    Id
                                    AppointmentNumber {
                                        value
                                        displayValue
                                    }
                                    Status {
                                        value
                                        displayValue
                                    }
                                    SchedStartTime {
                                        value
                                        displayValue
                                    }
                                    SchedEndTime {
                                        value
                                        displayValue
                                    }        
                                    FSL__InJeopardy__c {
                                        value
                                    }         
                                    FSL__InJeopardyReason__c {
                                        value
                                        displayValue
                                    }   
                                    Latitude { 
                                        value
                                    }        
                                    Longitude {
                                        value
                                    }        
                                }
                            }
                        }
                    }
                }
            }          
        `,
        variables: "$saQueryVars",
    })
    SAQueryResults( result ) {
        if (this._isCheckingInOut) return;
        this.addOutput('SAQueryResults');
        const { data, errors } = result;
        if (data){
            let sas = data.uiapi.query.ServiceAppointment.edges.map((edges) => edges.node);
            this._sas = [];
            sas.forEach((record) => {
                this._sas.push( 
                    { 
                        "Id": record.Id, 
                        "AppointmentNumber": record.AppointmentNumber.value,
                        "InJeopardy": record.FSL__InJeopardy__c.value, 
                        "Reason": record.FSL__InJeopardyReason__c.value,
                        "Latitude": record.Latitude.value,
                        "Longitude": record.Longitude.value,
                    } 
                );
            });
            this.saCount = this._sas.length;
            this.setLocationMarkers();
        }
        if (errors){
            this.handleError('SAQueryResults', errors);
        }
        this.saResult = result;
    }    
    
    // Variable for the graphQL query
    get saQueryVars(){
        let start = new Date();
        start.setHours(0,0,0,0);
        let startDate = start.toISOString();
        let end = new Date();
        end.setHours(23,59,59,999);
        let endDate = end.toISOString();
        console.log('startOfDay: ' + startDate);
        console.log('endOfDay: ' + endDate);
        return {
            startOfDay: startDate,
            endOfDay: endDate
        };
    }    

    // Refresh GraphQL and Location data
    refreshData(){
        this.showSpinner = true;
        this.errorMsgs = undefined;
        Promise.all([
            refreshGraphQL(this.srResult),
            //refreshGraphQL(this.saResult),
            this.getCurrentLocation()
        ])
        .then(() => {
            // All good!
        })
        .catch((errors) => {
            this.handleError('refreshData', errors);
        })
        .finally(() => {
            this.showSpinner = false;
        });
    }

    // Set Checked In/Out UI context 
    setCheckedContext(){
        this.addOutput('setCheckedContext');
        if (this._isCheckedIn){
            this.checkInOutTxt = this.CONSTANTS.CHECKOUTTXT;
            this.checkedBadgeCls = this.CONSTANTS.CHECKEDINCLS;
            this.btnVariant = this.CONSTANTS.BNTDESTRUCTIVE;
            this.btnLabel = this.CONSTANTS.CHECKOUT;
        } else {
            this.checkInOutTxt = this.CONSTANTS.CHECKINTXT;
            this.checkedBadgeCls = this.CONSTANTS.CHECKEDOUTCLS;
            this.btnVariant = this.CONSTANTS.BTNSUCCESS;
            this.btnLabel = this.CONSTANTS.CHECKIN;
        }
        if (this.locationEnabled) this.checkInOutTxt += this.CONSTANTS.CHECKLOC;
    }

    // Perform Check In/Out with geolocation details for last known location
    handleCheckInOut(){
        this.addOutput('handleCheckInOut');
        if (this._isCheckedIn && this.saCount > 0){
            LightningConfirm.open({
                message: this.CONSTANTS.CHECKOUTCONFIRM,
                variant: 'headerless',
            })
            .then((result) => {
                if (result === true){
                    this.processCheckInOut(false);
                }
            })
            .catch((error) => {
                this.handleError('handleCheckInOut::LightningConfirm', error);
            });
        } else {
            this.processCheckInOut(true);
        }
    }

    processCheckInOut(isCheckIn){
        this.addOutput('processCheckInOut');
        this._isCheckingInOut = true;
        this.showSpinner = true;
        Promise.all([
            this.updateAppointmentsInjeopardy(isCheckIn),
            this.checkInOut()
        ])
        .then(() => {
            // All good!
            this.updateComplete();
        })
        .catch((errors) => {
            this.handleError('processCheckInOut', errors);
        })
        .finally(() => {
            this.showSpinner = false;
        });        
    }

    // Update In Jeopardy of the appointments
    updateAppointmentsInjeopardy(isCheckIn){
        this.addOutput('updateAppointmentsInjeopardy');
        this._sas.forEach((record) => {
            const fields = {};
            fields['Id'] = record.Id;
            if (isCheckIn && record.InJeopardy && record.Reason === this.CONSTANTS.INJEOPARDYREASON){
                fields[FLD_INJEOPARDY.fieldApiName] = false;
                fields[FLD_INJEOPARDYREASON.fieldApiName] = '';
            } else if (!isCheckIn && !record.InJeopardy) {
                fields[FLD_INJEOPARDY.fieldApiName] = true;
                fields[FLD_INJEOPARDYREASON.fieldApiName] = this.CONSTANTS.INJEOPARDYREASON;
            }  
            this.updateAppointmentRecord(fields);                       
        });
    }

    // Update appointment record
    updateAppointmentRecord(fields){
        this.addOutput('updateAppointmentRecord');
        if (!fields.hasOwnProperty('Id')) return;
        const recordInput = { fields };
        updateRecord(recordInput)
        .then(() => {
            // Update successful!
        })
        .catch((error) => {
            this.handleError('updateAppointmentRecord', error);
        });  
    }

    // Actual check in/out record update
    checkInOut(){
        this.addOutput('checkInOut');
        this.showSpinner = true;
        let lat = null;
        let lng = null;
        let timestamp = null;
        if (this.currentLocation){
            lat = this.currentLocation.coords.latitude;
            lng = this.currentLocation.coords.longitude;
            timestamp = this.currentLocation.timestamp;
        }

        const fields = {};
        fields['Id'] = this.srId;
        fields[FLD_CHECKEDINOUT.fieldApiName] = this.checkedInOutValue === this.CONSTANTS.CHECKEDIN ? this.CONSTANTS.CHECKEDOUT : this.CONSTANTS.CHECKEDIN;
        fields[FLD_CHECKEDDATE.fieldApiName] = new Date().toISOString();
        if (lat !== null){
            //fields[FLD_LASTKNOWNDT.fieldApiName] = new Date(timestamp).toISOString();
            fields[FLD_LASTKNOWNLAT.fieldApiName] = lat;
            fields[FLD_LASTKNOWNLNG.fieldApiName] = lng;
        }

        const recordInput = { fields };
        // Update service resource record
        updateRecord(recordInput)
            .then(() => {
                // Update successful!
            })
            .catch((error) => {
                this.handleError('checkInOut::updateRecord', error);
            })
            .finally(() => {
                this.showSpinner = false;
            });        
    }

    updateComplete(){
        this.showCheckInOut = false;
        this._timeInterval = setInterval(() => {
            this.closeCheckInOut();
        }, 5000);
    }

    closeCheckInOut(){
        window.clearInterval(this._timeInterval);
        history.back();
    }

    // Get current Geolocation
    getCurrentLocation(){
        this.addOutput('getCurrentLocation');
        try{
            this.currentLocation = null;
            if (this.locationEnabled){
                // Configure options for location request
                const locationOptions = {
                    enableHighAccuracy: true
                }        
                this.myLocationService
                .getCurrentPosition(locationOptions)
                .then((result)  => {
                    this.currentLocation = result;
                    this.addOutput(JSON.stringify(this.currentLocation));
                })
                .catch((error) => {
                    this.locationEnabled = false;
                    if (error.code && error.code === 'USER_DENIED_PERMISSION'){
                        this.addOutput('User has disabled Location Service for this app!');
                    } else {
                        this.handleError('getCurrentLocation::getCurrentPosition', error);
                    }
                });
            } else {
                this.addOutput('LocationService API not available!');
            }
        } catch (errors){
            this.handleError('getCurrentLocation', errors);
        }
    }

    setLocationMarkers(){
        this.addOutput('setLocationMarkers');
        if (this._locationMarkers === undefined){
            const markers = [];
            markers.push({
                location: {
                    Latitude: this.currentLocation.coords.latitude,
                    Longitude: this.currentLocation.coords.longitude
                },
                title: this.CONSTANTS.CURRENTLOC,
                mapIcon: {
                    path: 'M 125,5 155,90 245,90 175,145 200,230 125,180 50,230 75,145 5,90 95,90 z',
                    fillColor: 'red',
                    fillOpacity: .8,
                    strokeWeight: 0,
                    scale: .10,
                    anchor: {x: 122.5, y: 115}
                }
            });            
            this.sasWithLocation = false;
            this._sas.forEach((record) => {
                if (typeof record.Latitude === 'number'){
                    markers.push({
                        location: {
                            Latitude: record.Latitude,
                            Longitude: record.Longitude
                        },
                        title: record.AppointmentNumber,
                        mapIcon: {
                            path: 'M 125,5 155,90 245,90 175,145 200,230 125,180 50,230 75,145 5,90 95,90 z',
                            fillColor: 'blue',
                            fillOpacity: .8,
                            strokeWeight: 0,
                            scale: .10,
                            anchor: {x: 122.5, y: 115}
                        }
                    });  
                    this.sasWithLocation = true;
                }          
            });
            this._locationMarkers = markers;
        }
    }    

   // Create lightning-map location markers
   // for current location and appointment locations
   get locationMarkers() {
        this.addOutput('get locationMarkers');
        return this._locationMarkers;
    }

    get showMap(){
        return (this.currentLocation);
    }

    // Handle error
    handleError(func, errors){
        this.errorMsgs = reduceErrors(errors);
        this.addOutput('ERROR: ' + func + ' - ' + JSON.stringify(this.errorMsgs));
    }

    clearOutput(){
        this.output = '';
    }

    toggleOutput(){
        this.showOutput = !this.showOutput;
    }

    addOutput(msg){
        // Create timestamp
        const now = new Date();
        const offsetMs = now.getTimezoneOffset() * 60 * 1000;
        const dateLocal = new Date(now.getTime() - offsetMs);
        const timestampStr = dateLocal.toISOString();  
        console.log(`${timestampStr} - ${msg}`);
        this.output = `${timestampStr} - ${msg}\n\n${this.output}`;
    }
}