/*

    Example component to show the implementation of the webStorage class

*/
import { LightningElement, api, track } from 'lwc';
import WebStorage from 'c/webStorage';
let ws;

const RECORDID = 'NewRecord';           // Record Id if the LWC is used as a Global Action
const INSTANCE = 'sessionStorage';      // Unique identifier for storage

export default class WebStorageAPI extends LightningElement {

    @api 
    recordId;

    // Name / Value pair as entered in the UI for properties
    name;
    val;
    
    // Validation if storage is available
    sessionStorageAvailable;

    // Array representation for displaying storage values
    @track
    keyVals = [];

    // Storage Type Options
    storageSelected = false;
    storageType;
    storageTypeOptions = [
        { label: 'Session Storage', value: 'sessionStorage' },
        { label: 'Local Storage', value: 'localStorage' },
    ];    

    // Handle storage type selection
    handleStorageTypeChange( event ) {
        this.storageType = event.detail.value;
        this.log( `Storage Type selected: ${ this.storageType }` );
        this.keyVals = [];
        this.initiateWebStorage();
        this.storageSelected = true;
    }

    // Initiate class and validate if storage is available
    initiateWebStorage() {
        if ( !this.recordId ) this.recordId = RECORDID;
        ws = new WebStorage( this, INSTANCE, this.recordId );
        this.sessionStorageAvailable = ws.isStorageAvailable( this.storageType );
        this.updateKeyVals();
    }

    // Input handler for the key
    handleNameChange( event ) {
        this.name = event.target.value;
    }

    // Input handler for the value
    handleValueChange( event ) {
        this.val = event.target.value;
    }

    // Store property name / value in storage
    storeProp() {
        ws.setProp( this.name, this.val );
        this.updateKeyVals();
        this.resetProp();
    }

    // Get property value
    getPropValue() {
        this.val = ws.getProp( this.name );
        this.log( `Retrieved value for property ${ this.name }: ${ JSON.stringify( this.val ) }` );
    }

    // Remove property from storage
    removeProp() {
        ws.removeProp( this.name );
        this.updateKeyVals();
        this.resetProp();
    }

    // Clear instance values from storage
    // will initialize empty storage for instance + recordId
    clearValues() {
        ws.clear( INSTANCE );
        this.updateKeyVals();
        this.resetProp();
    }    

    // Reset input params
    resetProp() {
        this.name = undefined;
        this.val = undefined;
    }

    // Update the key / val representation of storage
    // for rendering in UI
    updateKeyVals() {
        this.keyVals = this.convertObjToKeyValuePair( ws.getVal() );
        this.log( JSON.stringify( this.keyVals ) );
    }

    // Convert object to array of key / value
    convertObjToKeyValuePair( obj ){
        let objPairs = [];
        for ( const [key, value] of Object.entries( obj ) ) {
            if ( typeof value === 'object' ) {
                objPairs.push( { name: key, value: JSON.stringify( value ) } );
            } else {
                objPairs.push( { name: key, value: value } );
            }
        }
        return objPairs;
    }    

    // Log msg
    log( msg, consoleOnly ) {
        let debugPanel = this.template.querySelector( "c-debug-panel");
        if ( debugPanel ) {
            debugPanel.log( msg, consoleOnly );
        } else {
            console.log( msg );
        }
    }  

}