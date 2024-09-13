public with sharing class CustomMetadataTypeUtil {

    @AuraEnabled( cacheable = true )
    public static Map<String, String> getSFSMobileSettings() {
        try {
            Map<String, String> settings = new Map<String, String>();
            Map<String, SFS_Mobile_Setting__mdt> mdtSettings = SFS_Mobile_Setting__mdt.getAll();
            for ( SFS_Mobile_Setting__mdt mdtSetting : mdtSettings.values() ) {
                settings.put( mdtSetting.Label, mdtSetting.Value__c );
            }
            return settings;
        } catch ( Exception e ) {
            throw new AuraHandledException( e.getMessage() );
        }
    }

}