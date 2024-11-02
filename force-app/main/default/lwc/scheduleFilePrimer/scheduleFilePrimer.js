import { LightningElement, wire, track } from 'lwc';
import { gql, graphql, refreshGraphQL } from 'lightning/uiGraphQLApi';

// Interaction with WebStorage API
import WebStorage from 'c/webStorage';
let ws;

// Filters to filter out files
import FILEPRIMER_CONFIG from 'c/filePrimerConfig';

// For storing the timestamp of the latest
// file priming in WebStorage
const STORAGE_ID = 'scheduleFilePrimer';
const STORAGE_TYPE = 'localStorage';
const STORAGE_LASTPRIMEDATETIME = 'FilesPrimedLastDateTime';

const HORIZON_MAX_NUMEROFDAYS = 7;

export default class ScheduleFilePrimer extends LightningElement {

    // Number of days in the future, 
    // including today to query for
    // job to prime files for
    // Min 1
    horizon = 1;
    maxHorizon = HORIZON_MAX_NUMEROFDAYS;

    // Indicator priming started
    // by user interaction
    primingStarted = false;

    // Indicator to show Work Order details
    showDetails = false;

    // Date range for schedule
    fromDateTime;
    toDateTime;

    // Parent work orders
    // and work order line items
    // that are part of the schedule
    parentRecords;

    // Keeping track of total number of files
    // and the total file size and progress
    @track scheduleFiles = [];

    // File primer config 
    _filePrimerConfig = FILEPRIMER_CONFIG;

    // GraphQL query result to 
    // support refreshGraphQL
    _saQryResult;

    // Indicator if WebStorage is 
    // available on device
    _localStorageAvailable;

    constructor(){
        super();
        ws = new WebStorage( this, STORAGE_ID, 'GlobalAction' );
    }

    connectedCallback() {
        // Initiate web storage
        this._localStorageAvailable = ws.isStorageAvailable( STORAGE_TYPE );
    }

    // GraphQL wire to retrieve the schedule information
    @wire(
        graphql,
        {
            query: "$serviceAppointmentQry",
            variables: "$serviceAppointmentQryVars"
        }
    ) serviceAppointmentQryResults( result ){
        this._saQryResult = result;
        const { error, data } = result;
        if ( data ) {
            let records = data.uiapi.query.ServiceAppointment.edges.map( 
                ( edge ) => {
                    return {
                        id: edge.node.ParentRecordId.value,
                        type: edge.node.ParentRecordType.value
                    };
                } 
            );
            this.parentRecords = records;
        } else if ( error ){
            console.log( `serviceAppointmentQryResults error: ${ JSON.stringify( error ) }` );
        }
    }

    get serviceAppointmentQry(){
        return !this.fromDateTime || !this.toDateTime 
            ? undefined 
            : gql`
                query saQuery ($fromDateTime: DateTime, $toDateTime: DateTime) {
                    uiapi {
                        query {
                            ServiceAppointment (
                                first: 2000,
                                where: { 
                                    or: 
                                    [
                                        { and: 
                                            [
                                                { SchedEndTime: { gt: { value: $fromDateTime } } },
                                                { SchedEndTime: { lt: { value: $toDateTime } } }   
                                            ] 
                                        },
                                        { and: 
                                            [
                                                { SchedStartTime: { lt: { value: $toDateTime } } }, 
                                                { SchedEndTime: { gt: { value: $toDateTime } } }    
                                            ] 
                                        }
                                    ] 
                                } 
                            )
                            {
                                edges {
                                    node {
                                        Id
                                        ParentRecordId { value }
                                        ParentRecordType { value }
                                    }
                                }
                            } 
                        }
                    }
                }
            `;         
    }

    get serviceAppointmentQryVars() {
        return {
            fromDateTime: this.fromDateTime,
            toDateTime: this.toDateTime
        };        
    }  
    
    // Total number of parent records 
    // which are part of the schedule
    get numOfParentRecords() {
        return this.parentRecords ? this.parentRecords.length : 0;
    }

    // Set the time horizon for retrieving the schedule data
    setScheduleHorizon() {
        this.toDateTime = this.horizonDate( this.horizon );
        this.fromDateTime = this.horizonDate( 0 );
        console.log( `fromDateTime: ${ this.fromDateTime }, toDateTime: ${ this.toDateTime }` );
    }

    updateHorizon( event ) {
        this.horizon = parseInt( event.target.value, 10 );
    }

    // Return date for horizon window
    // so a full day is queried
    horizonDate( offsetInDays ) {
        let date = new Date();
        date.setDate( date.getDate() + offsetInDays );
        date.setHours( 0 );
        date.setMinutes( 0 );
        date.setSeconds( 0 );
        date.setMilliseconds( 0 );
        return date.toISOString();
    }

    // When user starts priming process
    startPriming() {
        this.primingStarted = true;
        ws.storeKeyValue( STORAGE_LASTPRIMEDATETIME, Date.now() );
        this.setScheduleHorizon();
    }    

    // Refresh data initiated by user
    async refreshSchedule() {
        try {
            await refreshGraphQL( this._saQryResult );

        } catch (error) {
            console.log( `refreshGraphQL error: ${ JSON.stringify( error ) }` );
        }           
    }

    // Event with file details related to a specific 
    // parent record to keep track of progress
    fileDetails( event ) {
        let recordIdx = this.scheduleFiles.findIndex(
            ( total ) => total.recordId === event.detail.recordId
        );
        if ( recordIdx === -1 ) {
            this.scheduleFiles.push( event.detail );
        } else {
            this.scheduleFiles[ recordIdx ] = event.detail;
        }
    }

    // Show / hide details about records
    toggleFiles() {
        let el = this.refs?.filesDiv;
        if ( el ) {
            el.style.display = el.style.display === 'none' ? 'block' : 'none';
            this.showDetails = !this.showDetails;
        }
    }    
    
    get detailsText() {
        return this.showDetails ? "Hide details" : "Show details";
    }

    get detailsIcon() {
        return this.showDetails ? "utility:down" : "utility:right";
    }    

    // Epoch timestamp of last priming
    get filesPrimedLastDateTime() {
        return this._localStorageAvailable ? ws.getValue( STORAGE_LASTPRIMEDATETIME ) : undefined;
    }

    // Formatted timestamp of last priming
    get filesPrimedLastDateTimeString() {
        return this.filesPrimedLastDateTime ? new Date( parseInt( this.filesPrimedLastDateTime, 10 ) ).toLocaleString() : '';
    }

    // Total size of all files 
    get totalSize() {
        return this.scheduleFiles.reduce( 
            ( total, file ) => {
                return total + file.size;
            },
            0
        );
    }

    // Total size in KiloBytes
    get totalSizeInKB() {
        return this.totalSize > 0 ? ( this.totalSize / 1000 ).toFixed(0) : 0;
    }

    // Total size which has been primed
    get totalSizeLoaded() {
        return this.scheduleFiles.reduce( 
            ( total, file ) => {
                return total + file.sizeLoaded;
            },
            0
        );
    }

    // Total size which has been primed in KiloBytes
    get totalSizeLoadedInKB() {
        return this.totalSizeLoaded > 0 ? ( this.totalSizeLoaded / 1000 ).toFixed(0) : 0;
    }

    // Progress relative to file size
    get primeProgress() {
        return this.totalSizeLoaded > 0 ? this.totalSizeLoaded / this.totalSize * 100 : 0;
    }

    // Total number of files
    get totalFiles() {
        return this.scheduleFiles.reduce( 
            ( total, file ) => {
                return total + file.files;
            },
            0
        );
    }

    // Total number of primed files
    get totalFilesLoaded() {
        return this.scheduleFiles.reduce( 
            ( total, file ) => {
                return total + file.loaded;
            },
            0
        );
    }    

    // Indicate priming is in progress
    get primingInProgress() {
        return this.totalFiles > 0 && this.totalFilesLoaded < this.totalFiles ? true : false;
    }

    // Which file extensions are primed?
    get allowedFileExts() {
        return this._filePrimerConfig.filterFiles && Array.isArray( this._filePrimerConfig.fileExtensions ) 
            && this._filePrimerConfig.fileExtensions.length > 0 
                ? this._filePrimerConfig.fileExtensions.join( ", ") 
                : "all file extensions";
    }

    // What is the maximum file size primed?
    get maxFileSize() {
        return this._filePrimerConfig.filterFiles && this._filePrimerConfig.maxFileSize !== undefined 
            ? `${ ( this._filePrimerConfig.maxFileSize / 1000 ).toFixed(0) }KB` 
            : "all file sizes";
    }


}