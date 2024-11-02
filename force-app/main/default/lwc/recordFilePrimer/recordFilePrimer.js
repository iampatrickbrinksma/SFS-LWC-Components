import { LightningElement, api, wire, track } from 'lwc';
import { gql, graphql, refreshGraphQL } from 'lightning/uiGraphQLApi';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';

// Filters to filter out files
import { FILEPRIMER_CONFIG } from 'c/filePrimerConfig';

// Fields for parent record details
import WO_WONUMBER_FIELD from "@salesforce/schema/WorkOrder.WorkOrderNumber";
import WOLI_LINENUMBER_FIELD from "@salesforce/schema/WorkOrderLineItem.LineItemNumber";
import WOLI_WONUMBER_FIELD from "@salesforce/schema/WorkOrderLineItem.WorkOrder.WorkOrderNumber";

// eslint-disable-next-line @salesforce/lwc-graph-analyzer/no-unresolved-parent-class-reference
export default class RecordFilePrimer extends NavigationMixin( LightningElement ) {

    // Parent record Id
    @api recordId;

    // Indication to show/hide
    // header, which can be used
    // if component is used as
    // child or not
    @api hideHeader = false;

    showFileList = false;

    renderFiles = false;

    // File details
    // including tracking progress
    @track filesDetails = [];

    _filePrimerConfig = FILEPRIMER_CONFIG;

    // Indicator if user
    // use refresh button 
    _refreshedData = false;

    // GraphQL wire adapter
    // result to support refresh
    _cdlQryResult;

    constructor() {
        super();
    }

    connectedCallback(){
        if ( this.showHeader ) {
            this.showFileList = true;
        }
    }

    // getRecord wire adapter to retrieve parent record details
    @wire(
        getRecord,
        {
            recordId: "$recordId",
            fields: "$recordFields"
        }
    )
    parentRecord;

    get recordType() {
        return this.recordId.substring(0, 3) === '0WO' ? "WorkOrder" : "WorkOrderLineItem";
    }

    // Depending on parent record type
    // get Work Order or Work Order Line Item fields
    get recordFields() {
        return this.recordType === "WorkOrder"
            ? [ WO_WONUMBER_FIELD ]
            : [ WOLI_LINENUMBER_FIELD, WOLI_WONUMBER_FIELD ];
    }

    // Depending on parent record type
    // get Work Order or Work Order Line Item details
    get parentRecordNumber() {
        return this.recordType === "WorkOrder" 
            ? getFieldValue( this.parentRecord.data, WO_WONUMBER_FIELD)
            : `${ getFieldValue( this.parentRecord.data, WOLI_WONUMBER_FIELD) } - ${ getFieldValue( this.parentRecord.data, WOLI_LINENUMBER_FIELD) }`;
    }

    // Icon to show in lightning-card
    get objectIcon() {
        return this.showHeader ? "action:download" : ( this.recordType === "WorkOrder" ? "standard:work_order" : "standard:work_order_item" );
    }

    // GraphQL wire to retrieve Files related to parent record
    @wire(
        graphql, 
        { 
            query: "$contentDocumentLinkQry", 
            variables: "$contentDocumentLinkQryVars"
        }
    )
    contentDocumentLinkQryResults( result ){
        this._cdlQryResult = result;
        const { error, data } = result;
        if ( data ) {
            let records = data.uiapi.query.ContentDocumentLink.edges.map( ( edge ) => {
                return {
                    recordId: this.recordId,
                    contentDocumentId: edge.node.ContentDocument.Id,
                    contentVersionId: edge.node.ContentDocument.LatestPublishedVersion.Id,
                    title: edge.node.ContentDocument.LatestPublishedVersion.Title.value,
                    type: edge.node.ContentDocument.LatestPublishedVersion.FileType.value,
                    size: edge.node.ContentDocument.LatestPublishedVersion.ContentSize.value,
                    ext: edge.node.ContentDocument.LatestPublishedVersion.FileExtension.value,
                    lastModDate: edge.node.ContentDocument.LatestPublishedVersion.LastModifiedDate.displayValue,
                };
            }); 
            if ( records.length > 0 ) {
                this.filesDetails = this.filterFiles( records );
                this.dispatchFileDetails();
                this.renderFiles = true;
            }
        } else if ( error ){
            console.log( `contentDocumentLinkQryResults error: ${ JSON.stringify( error ) }` );
        }
    }

    get contentDocumentLinkQry(){
        return gql`
            query ContentDocumentLinkQry( $recordId: ID = "" ) {
                uiapi {
                    query {
                        ContentDocumentLink (
                            where: { LinkedEntityId: { eq: $recordId } }
                            orderBy: { SystemModstamp: { order: DESC } }
                            first: 100
                        ) {
                            edges {
                                node {
                                    Id
                                    ContentDocumentId { value }  
                                    ContentDocument {
                                        Id
                                        LatestPublishedVersion { 
                                            Id
                                            ContentSize { value }
                                            FileExtension { value }
                                            FileType { value }
                                            LastModifiedDate { value, displayValue }
                                            Title { value }
                                        }
                                    }        
                                }
                            }
                        }
                    }   
                }
            }
        `;
    }

    get contentDocumentLinkQryVars() {
        return {
            recordId: this.recordId
        }
    }    

    // Filter files based on paramters set
    // in the File Primer Config
    filterFiles( files ) {
        return !this._filePrimerConfig.filterFiles ? files : 
            files.filter( 
                ( file ) => {
                    return ( this._filePrimerConfig.fileExtensions.length === 0 || 
                        ( 
                            this._filePrimerConfig.fileExtensions.length > 0 && 
                            this._filePrimerConfig.fileExtensions.includes( ( file.ext ).toLowerCase() ) 
                        ) ) && 
                        ( this._filePrimerConfig.maxFileSize !== undefined && file.size <= this._filePrimerConfig.maxFileSize );
                }
        );
    }

    // Navigate to related lists of parent record
    // so user can navigate to Files related list
    openRelated() {
        if ( !this.recordId ) return;
        this[ NavigationMixin.Navigate ] (
            {
                "type": "standard__webPage",
                "attributes": {
                    "url": `com.salesforce.fieldservice://v1/sObject/${ this.recordId }/related`
                }
            }
        );
    }  

    // Refresh data initiated by user
    async refreshFiles() {
        try {
            await refreshGraphQL( this._cdlQryResult );
            this._refreshedData = true;
        } catch (error) {
            console.log( `refreshGraphQL error: ${ JSON.stringify( error ) }` );
        }           
    }

    // Process event from child component to indicate a file has been loaded
    // This information is also dispatched to the parent component
    fileLoaded( event ) {
        let fileIdx = this.filesDetails.findIndex(
            ( file ) => file.contentVersionId === event.detail.contentVersionId
        );
        if ( fileIdx !== -1 ) {
            this.filesDetails[ fileIdx ].isLoaded = true;
        }
        this.dispatchFileDetails();
    }

    // Indicate if parent record has related files
    get hasFiles() {
        return this.numOfFiles > 0;
    }

    // Total number of related files
    get numOfFiles() {
        return this.filesDetails?.length;
    }

    // Total number of files that have been primed
    get filesLoaded() {
        return this.filesDetails.filter(
            ( file ) => file.isLoaded === true
        ).length;
    }

    // File prime progress for this parent record
    get primeProgress() {
        return this.rawSizeLoaded > 0 ? this.rawSizeLoaded / this.totalRawSize * 100 : 0;
    }

    // Total size of files in bytes
    get totalRawSize() {
        return this.filesDetails.reduce( 
            ( total, file ) => {
                return total + file.size;
            },
            0
        );
    }

    // Total size of files in KiloBytes
    get totalSizeKB() {
        return ( this.totalRawSize / 1000 ).toFixed(0);
    }

    // Total size of files that have
    // been primed in bytes
    get rawSizeLoaded() {
        return this.filesDetails.reduce( 
            ( total, file ) => {
                return file.isLoaded ? total + file.size : total;
            },
            0
        );
    }

    // Total size of files that have
    //  been primed in KiloBytes
    get sizeLoadedKB() {
        return ( this.rawSizeLoaded / 1000 ).toFixed(0);
    }

    // Get text for file details
    get fileDetailsText() {
        return this.showFileList ? "Hide files" : "Show files";
    }

    // Get icon for file details
    get fileDetailsIcon() {
        return this.showFileList ? "utility:down" : "utility:right";
    }

    // Indicator to show some additional information 
    // if component is not a child component
    get showHeader() {
        return !this.hideHeader;
    }

    // Show / hide list of files
    toggleFiles() {
        let el = this.refs?.filesDiv;
        if ( el ) {
            this.showFileList = !this.showFileList;
            el.className = this.fileListClass;
        }
    } 

    // CSS class to show/hide file list
    get fileListClass() {
        return this.showFileList ? "showFilesList" : "hideFilesList";
    }

    // Dispatch event which includes inforamtion
    // about total nr of files, size and progress
    dispatchFileDetails() {
        this.dispatchEvent(
            new CustomEvent( 'filedetails', 
                {
                    detail: {
                        recordId: this.recordId,
                        files: this.numOfFiles,
                        loaded: this.filesLoaded,
                        size: this.totalRawSize,
                        sizeLoaded: this.rawSizeLoaded
                    }
                }
            )
        );
    }

}