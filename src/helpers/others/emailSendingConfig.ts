import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export default class EmailSendingConfig {
    public static readonly buildEmailTemplate = (...args: any[]) => {
        // Compile the welcome email template by providing the template path at index [0]
        const templatePath = path.join(__dirname, args[0]);
        const template = handlebars.compile(
            fs.readFileSync(templatePath, 'utf8'),
        );

        // Generate the HTML for the email with the template data Object at index [1]
        return template(args[1]);
    };
}
