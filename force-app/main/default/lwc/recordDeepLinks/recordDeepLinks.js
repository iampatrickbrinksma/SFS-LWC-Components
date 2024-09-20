import { LightningElement, api, wire, track } from 'lwc';
import { gql, graphql, refreshGraphQL } from 'lightning/uiGraphQLApi';
import { NavigationMixin } from 'lightning/navigation';
import signUrl from '@salesforce/apex/DeepLinkUtil.signUrl';

export default class RecordDeepLinks extends NavigationMixin( LightningElement ) {

    @api
    recordId;

    // Deeplink information as stored in a custom field on the record
    deepLinkUrls;

    // What source to use for the signature
    // the one stored on the record, or use
    // apex to obtain a new signature from the server (online only)
    selectedSource = 'record';
    sourceOptions = [
        { label: 'Record', value: 'record' },
        { label: 'Server', value: 'server' }
    ];

    // The deep link destinations
    // that the user can select
    selectedDeepLink;
    @track
    deepLinkOptions = [];

    // GraphQL is used to query data
    // and a refreshGraphQL is forced to
    // get the latest server data
    _dataRefreshed = false;
    _graphQLResults;

    // Wire to retrieve Service Appointment record with the deeplink information 
    // stored in the custom field
    @wire(graphql, { query: '$recordQuery', variables: '$recordQueryVars' })
    recordQryResults(result) {
        this._graphQLResults = result;
        const { data, error } = result;
        this.log( `recordQryResults - callback` );
        if (data) {
            this.log( `recordQryResults - data emitted...` );
            if ( !this._dataRefreshed ) {
                this._dataRefreshed = true;
                this.refreshRecord();
            }
            // As data is queried using a record id
            // we can assume only one record is returned
            let records = data.uiapi.query.ServiceAppointment.edges.map( ( edge ) => edge.node );
            this.log( JSON.stringify( records ) );
            if ( records[0].Deeplink_Url__c.value ) {
                // Convert to JSON object
                this.deepLinkUrls = JSON.parse( records[0].Deeplink_Url__c.value );
                this.log( JSON.stringify( this.deepLinkUrls ) );
                // Extract options for the deep link destination dropdown
                this.deepLinkOptions = this.deepLinkUrls.map( ( url ) => {
                    return {
                        label: url.params.label,
                        value: url.action
                    }
                } );
            }
        }
        if (error) {
            this.log(`recordQryResults Error: ${JSON.stringify(error)}`);
        }
    }

    // Getter for graphql query to control when the wire is triggered
    get recordQuery() {
        if ( !this.recordId ) return;
        return gql`
            query recordQry( $recordId: ID = "" ) {
                uiapi {
                    query {
                        ServiceAppointment
                        ( 
                            where: { Id: { eq: $recordId } }, 
                            first: 1
                        ) {
                            edges {
                                node {
                                    Id
                                    Deeplink_Url__c { value, displayValue }
                                }
                            }
                        }
                    }
                }
            }            
        `;
    }

    // Variable for the graphQL query   
    get recordQueryVars() {
        return {
            recordId: this.recordId
        };
    }    

    // When user changes the selection of the source value
    handleSourceChange( event ) {
        this.selectedSource = event.detail.value;
        this.log( this.selectedSource );
    }
    
    // When user changes the selection of the deep link destination
    handleDeepLinkChange( event ) {
        this.selectedDeepLink = event.detail.value;
        this.log( this.selectedDeepLink );
    }

    // Open deep link from the selected context
    handleOpenDeepLink(){
        // Get the params from the selected deep link destinatioin
        let params = this.deepLinkUrls.filter( ( url ) => url.action === this.selectedDeepLink )[0].params;
        this.log( JSON.stringify( params ) );
        // If the source is record or the deep link doesn't require a signature, navigate to the url
        // otherwise get a signature from the server, and navigate to the url from that function
        if ( this.selectedSource === 'record' || params.sign === 'false' ) {
            this.navigateTo( this.getUrl( params ) );
        } else {
            this.signUrlOnServer( params );
        }
    }  
    
    // Obtain signature from the server and
    // open the deep link url with the signature suffixed
    async signUrlOnServer( params ) {
        this.log( params.url );
        try {
            let sig = await signUrl( 
                {
                    url: params.url
                }
            );
            this.log( sig ); 
            let url = this.getUrl( 
                { 
                    url: params.url,
                    signature: sig,
                    sign: params.sign
                }
            )
            this.navigateTo( url );
        } catch ( err ) {
            this.log( JSON.stringify( err ) );
        }     
    }

    // Build the correct URL
    getUrl( params ) {
        let url;
        if ( params.sign === 'true' ) {
            if ( params.url.includes( '&' ) ) {
                url = `${ params.url }&__signature=${ params.signature }`;
            } else {
                url = `${ params.url }?__signature=${ params.signature }`;
            }
        } else {
            url = params.url;
        }
        this.log( url );
        return url;
    }

    // Navigate to the provided URL
    navigateTo( url ) {
        this.log( `Navigating to ${ url }` );
        this[NavigationMixin.Navigate](
            {
                "type": "standard__webPage",
                "attributes": {
                    "url": url
                }
            }
        );        
    }

    // Refresh GraphQL 
    async refreshRecord() {
        this.log( `Refreshing Query using refreshGraphQL...` );
        try {
            await refreshGraphQL( this._graphQLResults );
            this.log( `Refreshing Query using refreshGraphQL completed!` );
        } catch (error) {
            this.log( `Error returned by refreshGraphQL: ${ JSON.stringify( error ) }` );
        }        
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