import { LightningElement, api } from 'lwc';

export default class DebugPanel extends LightningElement {

    @api
    writeToConsole;

    output = '';

    @api
    log( msg, consoleOnly ) {
        this.addToOutput( msg, consoleOnly );
    }

    addToOutput( msg, consoleOnly ) {
        let time = this.timeStamp();
        if ( !consoleOnly ) {
            this.output = time + ' :: ' + msg + '\n\n' + this.output;
        }
        if ( this.writeToConsole ) {
            console.log( time + ' :: ' + msg );
        }        
    }    

    timeStamp() {
        // Create timestamp
        const now = new Date();
        const offsetMs = now.getTimezoneOffset() * 60 * 1000;
        const dateLocal = new Date(now.getTime() - offsetMs);
        return dateLocal.toISOString().replace(/-/g, "/").replace("T", " ");  
    }

    // Copy content
    copyOutput() {
        if ( navigator.clipboard && window.isSecureContext ) {
            navigator.clipboard.writeText( this.output );
        }
    }

    // Clear debug output
    clearOutput() {
        this.output = '';
    }    

}