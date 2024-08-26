import { LightningElement, wire, track } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import getAllSObjects from '@salesforce/apex/SObjectUtil.getAllSObjects';
import { reduceErrors } from 'c/ldsUtils';

export default class ObjectDetails extends LightningElement {
    
    // Array for SObjects picklist
    sObjects = [];

    // Current selected SObject API Name
    objApiName;

    // Object Info Details converted to key/value pairs
    @track
    details;

    // Crumbs for navigation
    crumbs = [];

    // Any errors for displaying
    errors;
    
    // Current level of crumbs
    _crumbLevel = 0;

    // Copy of the details at object level
    _details;

    // objectInfo wire results
    _objInfo;

    connectedCallback() {
        // Get all accessible SObjects using Apex method
        // Note: This does include objects that are not supported
        // by the UI API, but currently there is no way to determine
        // from the metadata if a SObject is supported or not
        getAllSObjects()
        .then( ( result ) => {
            let objs = [];
            for ( const [key, value] of Object.entries( result ) ) {
                objs.push(
                    { label: value, value: key }    
                );
            }
            this.sObjects = objs;
        } )
        .catch( ( error ) => {
            this.log( `getAllSObjects error: ${ JSON.stringify( error ) }` );
            this.errors = reduceErrors( error );
        } );
    }    

    @wire( getObjectInfo, { objectApiName: '$objApiName' } )
    objectInfoResult( result ) {
        this._objInfo = result;
        const { data, error } = result;
        if ( data ) {
            this.resetErrors();
            this.log( `Data emitted in objectInfoResult.` );
            // Only log JSON result in console
            this.log( JSON.stringify( data ), true );
            // Convert to key / value pair for easier display and navigation
            this.details = this.convertObjToKeyValuePair( data );
            this._details = this.details;
            this.setTopLevelCrumb();
        }
        if ( error ) {
            this.log( `Error in objectInfoResult: ${ JSON.stringify( error ) }` );
            this.errors = reduceErrors( error );
        }
    }

    updateObjApiName( event ) {
        // Replace any spaces, as SObject API names do not support spaces
        this.inputValue = event.target.value.replace(/\W/g, '');
    }

    getObjDetails() {
        this.resetDetails();
        this.objApiName = this.inputValue;
    }

    closeDetails() {
        this.resetDetails();
        this.objApiName = undefined;
    }

    handleSObjectChange( event ) {
        this.resetDetails();
        this.objApiName = event.target.value;
        this.inputValue = this.objApiName;
    }

    resetDetails() {
        this.details = undefined;
        this.crumbs = [];
        this._crumbLevel = 0;
    }

    resetErrors() {
        this.errors = undefined;
    }

    handleMoreInfo( event ) {
        let moreInfo = event.target.dataset.name;
        this.log( ` Finding more info for: ${ moreInfo }` );
        this.findDetails( moreInfo );
    }

    findDetails( name ) {
        let dtls = this.details.find( dtl => dtl.name === name );
        if ( dtls ) {
            this._crumbLevel++;    
            this.crumbs.push( { name: name, level: this._crumbLevel } );            
            this.details = this.convertObjToKeyValuePair( dtls.objectValue );
        }
    }

    navigateTo( event ) {
        let lvl = event.target.dataset.level;
        this.log( `Navigating to ${ this.crumbs[ lvl ] }` );
        let crmbs = this.crumbs;
        this.resetDetails();
        this.details = this._details;
        this.setTopLevelCrumb();
        for ( let i = 1; i <= lvl; i++ ) {
            this.findDetails( crmbs[i].name );
        }
    }

    setTopLevelCrumb() {
        this.crumbs.push( { name: this.objApiName, level: 0 } );
    }

    convertObjToKeyValuePair( obj ){
        let objPairs = [];
        for ( const [key, value] of Object.entries( obj ) ) {
            if ( value === null ) {
                objPairs.push( { name: key, value: 'null', object: false } );
            } else if ( typeof value === 'object' && Object.keys( value ).length === 0 ) {
                objPairs.push( { name: key, value: '[]', object: false } );
            } else if ( typeof value === 'object' ) {
                objPairs.push( { name: key, value: '<object>', object: true, objectValue: value } );
            } else {
                objPairs.push( { name: key, value: value, object: false } );
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