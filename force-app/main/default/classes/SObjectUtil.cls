public with sharing class SObjectUtil {

    @AuraEnabled(cacheable=true)
    public static Map<String, String> getAllSObjects() {
        Map<String, String> sObjectsMap = new Map<String, String>();
        for(Schema.SObjectType objTyp : Schema.getGlobalDescribe().Values()) {
            if ( objTyp.getDescribe().isAccessible() )
                sObjectsMap.put( objTyp.getDescribe().getName(), objTyp.getDescribe().getLabel() );
        }
        return sObjectsMap;
    }

}