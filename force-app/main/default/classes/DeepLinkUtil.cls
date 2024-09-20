public with sharing class DeepLinkUtil {

    /*
    Util class to create signed deep links for the Field Service mobile app

    Help doc:
        https://developer.salesforce.com/docs/atlas.en-us.field_service_dev.meta/field_service_dev/fsl_dev_mobile_deep_linking_hide_security_dialog.htm
    
    Create private and public keys (Linux and Mac):
        openssl ecparam -genkey -name prime256v1 -noout -out private.pem
        openssl ec -in private.pem -pubout -out public.pem

    public.pem:
        -----BEGIN PUBLIC KEY-----
        MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEAJJHO3CE19sDeIogoXj8iuuXpxB3
        4C1IFC7ylXEPcmi6gmbF98udKYkRw+z0S7qb1GuiY15wGUuUzjMsKdQs9A==
        -----END PUBLIC KEY-----            

    public key:
        MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEAJJHO3CE19sDeIogoXj8iuuXpxB34C1IFC7ylXEPcmi6gmbF98udKYkRw+z0S7qb1GuiY15wGUuUzjMsKdQs9A==

    private.pem:
        -----BEGIN EC PRIVATE KEY-----
        MHcCAQEEID4VmOU/yZBpNkRtImURY6CDQV71Rm9ymyKoIIUywAlhoAoGCCqGSM49
        AwEHoUQDQgAEAJJHO3CE19sDeIogoXj8iuuXpxB34C1IFC7ylXEPcmi6gmbF98ud
        KYkRw+z0S7qb1GuiY15wGUuUzjMsKdQs9A==
        -----END EC PRIVATE KEY-----        

    Convert private key to pkcs8:
        openssl pkcs8 -topk8 -nocrypt -in private.pem -outform PEM

    output:
        -----BEGIN PRIVATE KEY-----
        MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgPhWY5T/JkGk2RG0i
        ZRFjoINBXvVGb3KbIqgghTLACWGhRANCAAQAkkc7cITX2wN4iiChePyK65enEHfg
        LUgULvKVcQ9yaLqCZsX3y50piRHD7PRLupvUa6JjXnAZS5TOMywp1Cz0
        -----END PRIVATE KEY-----    

    private key (example):
        MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgPhWY5T/JkGk2RG0iZRFjoINBXvVGb3KbIqgghTLACWGhRANCAAQAkkc7cITX2wN4iiChePyK65enEHfgLUgULvKVcQ9yaLqCZsX3y50piRHD7PRLupvUa6JjXnAZS5TOMywp1Cz0


        
    */

    // Private key generated and converted as described above
    private static final String PRIVATE_KEY = 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgPhWY5T/JkGk2RG0iZRFjoINBXvVGb3KbIqgghTLACWGhRANCAAQAkkc7cITX2wN4iiChePyK65enEHfgLUgULvKVcQ9yaLqCZsX3y50piRHD7PRLupvUa6JjXnAZS5TOMywp1Cz0';
    // Algorithm used to sign the url
    private static final String ALGORITHM = 'ECDSA-SHA256';

    // Method to sign the url using the private key
    @AuraEnabled(cacheable=false)
    public static String signUrl( String url ) {
        Blob privateKeyBlob = EncodingUtil.base64Decode( PRIVATE_KEY );
        Blob urlBlob = Blob.valueOf( url );
        Blob signatureBlob = Crypto.sign( ALGORITHM, urlBlob, privateKeyBlob );
        String signature = EncodingUtil.base64Encode( signatureBlob );
        signature = signature.replace( '/+', '_-' );
        signature = signature.replace( '=', '' );
        signature = signature.replace( '\n', '' );
        return signature;
    }  

    // Source: https://developer.salesforce.com/docs/atlas.en-us.field_service_dev.meta/field_service_dev/fsl_dev_mobile_deep_linking_schema.htm
    // Base Url 
    private static final String DEEPLINK_BASE_URL = 'com.salesforce.fieldservice://v1';
    // Next part for standard actions
    private static final String DEEPLINK_ACTION_URL = '/sObject/<id>/<action>';
    // Next part for custom Quikc Actions
    private static final String DEEPLINK_QUICKACTION_URL = '/sObject/<id>/quickaction/<action>';
    
    // Standard actions with an indicator if it requires a signature
    private static List<deepLinkAction> actionsToSign = new List<deepLinkAction>{ 
        new deepLinkAction( 'details', 'Details', false ),
        new deepLinkAction( 'related', 'Related', false ),
        new deepLinkAction( 'products', 'Product', false ),
        new deepLinkAction( 'feed', 'Feed', false ),
        new deepLinkAction( 'location', 'Location', false ),
        new deepLinkAction( 'edit', 'Edit', true ),
        new deepLinkAction( 'createservicereport', 'Service Report', true )
    };

    // Method to create deep link urls with a signature (if needed) for the more static deep links
    public static List<deepLinkUrl> createDeepLinkUrls( Id recordId, List<deepLinkAction> quickActions ) {    
        List<deepLinkUrl> deepLinkUrls = new List<deepLinkUrl>();

        for ( deepLinkAction action : actionsToSign ) {
            String url = DEEPLINK_BASE_URL + DEEPLINK_ACTION_URL;  
            String signature;         
            url = url.replace( '<id>', recordId );
            url = url.replace( '<action>', action.name );

            if ( action.sign ) {
                signature = signUrl( url );
            }

            deepLinkUrls.add( 
                new deepLinkUrl( action.name, action.label, url, signature, String.valueOf( action.sign ) )
            );
        }

        for ( deepLinkAction action : quickActions ) {
            String url = DEEPLINK_BASE_URL + DEEPLINK_QUICKACTION_URL;  
            String signature = '';         
            url = url.replace( '<id>', recordId );
            url = url.replace( '<action>', action.name );

            if ( action.params != null && !action.params.isEmpty() ) { 
                url = addQuestionMarkToUrl( url );               
                for ( String param : action.params.keySet() ) {
                    url += param + '=' + EncodingUtil.urlEncode( action.params.get( param ), 'UTF-8' ) + '&';
                }
                url = url.left( url.length() - 1 );
            }

            signature = signUrl( url );

            deepLinkUrls.add( 
                new deepLinkUrl( action.name, action.label, url, signature, 'true' )
            );
        }

        return deepLinkUrls;
    }

    // Method to create deep link urls with a signature the standard actions / links
    public static List<deepLinkUrl> createDeepLinkUrls( Id recordId ) {
        return createDeepLinkUrls( recordId, null );
    }

    public class deepLinkAction {
        public String name { get; set; }
        public String label { get; set; }
        public Boolean sign { get; set; }
        public Map<String, String> params { get; set; }

        public deepLinkAction( String name, String label, Boolean sign ) {
            this.name = name;
            this.label = label;
            this.sign = sign;
        }

        public deepLinkAction( String name, String label, Boolean sign, Map<String, String> params ) {
            this.name = name;
            this.label = label;
            this.sign = sign;
            this.params = params;
        }        
    }

    // Structure for returning deeplink information for a record
    public class deepLinkUrl {
        public String action { get; set; }
        public Map<String, String> params { get; set; }

        public deepLinkUrl( String action, String label, String url, String signature, String sign ) {
            this.action = action;
            this.params = new Map<String, String>{
                'label' => label,
                'url' => url,
                'sign' => sign
            };
            if ( signature != null ) {
                this.params.put( 'signature', signature );               
            }
        }
    }

    // Method to add a ? to the URL if it doesn't have one yet
    private static String addQuestionMarkToUrl( String Url ) {
        if ( Url.left( Url.length() - 1) != '?' ) {
            return Url + '?';
        } else {
            return Url;
        }
    }

}