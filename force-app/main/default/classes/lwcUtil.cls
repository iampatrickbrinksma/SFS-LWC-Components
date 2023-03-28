public with sharing class lwcUtil {

    @AuraEnabled(cacheable=false)
    public static string checkIfOnline(){
        return 'Online';
    }
    
}