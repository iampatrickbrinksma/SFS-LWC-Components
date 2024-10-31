import { LightningElement, api, wire, track } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getRecord } from 'lightning/uiRecordApi';

// Mapping of file types to icons and a default icon
import { FILE_TYPES } from './fileTypes';

// eslint-disable-next-line @salesforce/lwc-graph-analyzer/no-unresolved-parent-class-reference
export default class FilePrimer extends LightningElement {

    @api parentRecordId;
    @api contentDocumentId;
    @api contentVersionId;

    // File details for display
    @track file = {};

    // Indicator that file
    // details are shown or
    // hidden
    showFileDetails;
    
    // Object info and fields
    contentDocumentObjInfo
    contentDocumentFields;
    contentVersionObjInfo
    contentVersionFields;

    fileTypes = FILE_TYPES;

    // Prime Object Info (metadata) for
    // the objects related to Files in Salesforce:
    // ContentDocument, ContentDocumentLink and ContentVersion
    @wire(
        getObjectInfo, 
        { 
            objectApiName: 'ContentDocument' 
        } 
    )
    contentDocumentObjInfoResult( result ) {
        this.contentDocumentObjInfo = result;
        const { error, data } = result;
        if ( data ) {
            // Get all fields for getRecord wire
            this.contentDocumentFields = this.objectFields( data.fields, 'ContentDocument' );
        } else if ( error ) {
            console.log( `contentDocumentObjInfoResult error: ${ JSON.stringify( error ) }` );
        }
}

    @wire(
        getObjectInfo, 
        { 
            objectApiName: 'ContentVersion' 
        }
    )
    contentVersionObjInfoResult( result ) {
            this.contentVersionObjInfo = result;
            const { error, data } = result;
            if ( data ) {
                // Get all fields for getRecord wire
                this.contentVersionFields = this.objectFields( data.fields, 'ContentVersion' );
            } else if ( error ) {
                console.log( `contentVersionObjInfoResult error: ${ JSON.stringify( error ) }` );
            }
    }

    // getRecord wire adapter to retrieve all fields 
    // of the ContentDocument record so the file is 
    // available for offline viewing
    @wire(
        getRecord, 
        { 
            recordId: "$contentDocumentId", 
            fields: "$contentDocumentFields"
        }
    )
    contentDocumentResult( result ) {
        const { error, data } = result;
        if ( data ) {
            // do nothing
        } else if ( error ) {
            console.log( `contentDocumentResult error: ${ JSON.stringify( error ) }` );
        }
    }

    // getRecord wire adapter to retrieve all fields 
    // of the ContentVersion record so the file is 
    // available for offline viewing    
    @wire(
        getRecord, 
        { 
            recordId: "$contentVersionId", 
            fields: "$contentVersionFields"
        }
    )
    contentVersionResult( result ) {
        const { error, data } = result;
        if ( data ) {
            // Capture file details
            this.file.title = data.fields.Title.value;
            this.file.desc = data.fields.Description.value;
            this.file.type = data.fields.FileType.value;
            this.file.ext = data.fields.FileExtension.value;
            this.file.size = data.fields.ContentSize.value;
            this.file.lastModDate = data.fields.LastModifiedDate.displayValue;
            this.file.url = data.fields.VersionDataUrl.value;
        } else if ( error ) {
            console.log( `contentVersionResult error: ${ JSON.stringify( error ) }` );
        }
    }    

    // Dispatch event that file has been loaded
    // For files supported by the <img> tag
    // the onload event is triggered
    fileLoaded(){
        this.dispatchLoadEvent( 'success' );
    }

    // Dispatch event that file has been loaded
    // For files not supported by the <img> tag
    // the onerror event is triggered. This does
    // introduce a risk when a file really could
    // not be loaded...
    errorOnLoad(){
        this.dispatchLoadEvent( 'error' );
    }

    // Dispatch event to parent component 
    // indicating file has been loaded
    dispatchLoadEvent( eventType ){
        this.dispatchEvent(
            new CustomEvent(
                'fileloaded', 
                {
                    detail: {
                        type: eventType,
                        contentVersionId: this.contentVersionId
                    }
                }
            )
        );
    }

    // Show / hide file details
    toggleFile(){
        let el = this.refs?.imgDiv;
        if ( el ) {
            el.style.display = el.style.display === 'none' ? 'block' : 'none';
            this.showFileDetails = !this.showFileDetails;
        }
    }

    // Get text for file details
    get fileDetailsText() {
        return this.showFiles ? "Hide file details" : "Show file details";
    }

    // Get icon for file details
    get fileDetailsIcon() {
        return this.showFileDetails ? "utility:down" : "utility:right";
    }    

    // File type
    get typeOfFile() {
        return this.file?.type ? this.fileTypes[ this.file.type ] ? this.fileTypes[ this.file.type ] : this.fileTypes[ 'UNKNOWN' ] : undefined;
    }

    // File size in KiloBytes
    get fileSizeInKb() {
        return this.file.size ? `${ ( this.file.size / 1000 ).toFixed(0) }KB` : '';
    }

    // Extract all field names in syntax
    // <ObjectApiName>.<FieldApiName>
    // for getRecord wire adapter
    objectFields( objectFields, objectType ) {
        let keys = Object.keys( objectFields );
        let fields = keys.map( ( f ) => {
            return `${ objectType }.${ f }`
        });
        return fields;
    }    

}