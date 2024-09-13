import { LightningElement, wire } from 'lwc';
import getSFSMobileSettings from '@salesforce/apex/CustomMetadataTypeUtil.getSFSMobileSettings';

export default class PrimeCustomMetadata extends LightningElement {

    settings;

    @wire( getSFSMobileSettings )
    getSettings( { error, data } ) {
        if ( data ) {
            this.settings = this.convertObjToKeyValuePair( data );
        } else if ( error ) {
            console.log( `Error in getSettings: ${ JSON.stringify( error ) }` );
        }
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

}