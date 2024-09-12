/*

    Store and retrieve data from sessionStorage
    Data is stored per 'instance', whereby the 'instance'
    is the identifier to store and retrieve values

    key: <instance>
    value: {
        recordId: <recordId>,
        state: <new|restored>
        properties: [
            { 
                name: <name>,
                value: <value>
            },
        ]
    }

    State: Indicator if the data is new or restored

*/

let mainObj;
let storage;
let instance;
let id;
let val;

const STATE_NEW = 'new';
const STATE_RESTORED = 'restored';

export default class WebStorage {

    constructor( superMain, inst, recordId ) {
        mainObj = superMain;
        instance = inst;
        id = recordId;
    }

    isStorageAvailable( storageType ) {
        try {
            storage = window[ storageType ];
            const x = "__storage_test__";
            this.storeKeyValue(x, x);
            this.removeKey(x);
            this.restoreState();
            return true;
        } catch ( error ) {
            return (
                error instanceof DOMException &&
                error.name === "QuotaExceededError" &&
                // acknowledge QuotaExceededError only if there's something already stored
                storage &&
                storage.length !== 0
            );
        }
    }   
    
    restoreState(){
        if ( storage && id ) {
            let valStr = this.getValue( instance );
            if ( valStr ) {
                try {
                    console.log( `webStorage: Value (string) retrieved: ${ valStr }` );
                    val = JSON.parse( valStr );
                } catch ( error ) {
                    console.log( `webStorage: Error parsing value for ${ instance }: ${ JSON.stringify( error ) }` );
                    val = undefined;
                }
            }
            if ( !val || val.recordId !== id ) {
                val = {
                    recordId: id,
                    state: STATE_NEW,
                    properties: {}
                };
            } else {
                val.state = STATE_RESTORED;
            }
            this.storeKeyValue( instance, val );
        }
    }    

    getVal() {
        return val;
    }

    getProp( name ) {
        let prop;
        let propStr = val.properties[ name ];
        if ( propStr ) {
            try {
                prop = JSON.parse( propStr );
            } catch ( error ) {
                console.log( `webStorage: Error JSON parsing property ${ name }: ${ JSON.stringify( error ) }` );
                prop = propStr;
            }
        }
        return prop;
    }

    setProp( name, value ) {
        val.properties[ name ] = value;
        this.storeKeyValue( instance, val );
    }

    removeProp( name ) {
        delete val.properties[ name ];
        this.storeKeyValue( instance, val );
    }

    clear() {
        val = undefined;
        this.removeKey( instance );
        this.restoreState();
    }

    getValue( key ){
        return storage.getItem( key );
    }

    storeKeyValue( key, value ) {
        console.log( `Storing item: ${ key } with value: ${ JSON.stringify( value ) }` );
        storage.setItem( key, JSON.stringify( value ) );
    }    

    removeKey( key ) {
        console.log( `Removing item: ${ key }` );
        try {
            storage.removeItem( key );
        } catch ( error ) {
            console.log( `Error while removing item from storage: ${ JSON.stringify( error ) }` );
        }
    }      

}