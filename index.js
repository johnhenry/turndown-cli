#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Minimist = require('minimist');
const TurndownService = require('turndown');

function serialize(list) {
    let output = [];
    for (let i = 0; i < list.length; i++) {
        output.push(`${i+1}) ${list[i]}`);
    }
    return output.join('    ');
}

const appVersion = '1.0.3';
const appCreationYear = 2021;

var currentYear = (new Date()).getFullYear();
var copyrightYear = (currentYear <= appCreationYear) ? appCreationYear : `${appCreationYear}-${currentYear}`;

const Options = {
    headingStyle: ['setext', 'atx'],
    hr: ['\*', '-', '\_'],
    bulletListMarker: ['\*', '-', '+'],
    codeBlockStyle: ['indented', 'fenced'],
    fence: ['\`', '~'],
    emDelimiter: ['\_', '\*'],
    strongDelimiter: ['\*\*', '\_\_'],
    linkStyle: ['inlined', 'referenced'],
    linkReferenceStyle: ['full', 'collapsed', 'shortcut'],
    preformattedCode: ['false', 'true']
};

async function fetchContentFromUrl(url, playwright) {
    const browser = await playwright.chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    const content = await page.content();
    await browser.close();
    return content;
}

var argv = Minimist(process.argv.slice(2));

if (argv.h || argv.help) {
    console.log(`
Usages:
  turndown-cli (-h|-v)
  turndown-cli <source> (<target>)
  turndown-cli (<option>=<choice>) <source> (<target>)

Parameters:
  source    HTML source filepath
  target    Markdown target filepath
  option    Any option from provided options
  choice    Any choice out of provided choices

Options:
  -h --help       Show help contents
  -v --version    Show version information
  -t --head       Heading style
                  ${serialize(Options.headingStyle)}
  -r --hr         Horizontal rule
                  ${serialize(Options.hr)}
  -b --bullet     Bullet list marker
                  ${serialize(Options.bulletListMarker)}
  -c --code       Code block style
                  ${serialize(Options.codeBlockStyle)}
  -f --fence      Fence style
                  ${serialize(Options.fence)}
  -e --em         Em delimiter
                  ${serialize(Options.emDelimiter)}
  -s --strong     Strong delimiter
                  ${serialize(Options.strongDelimiter)}
  -l --link       Link style
                  ${serialize(Options.linkStyle)}
  -u --linkref    Link reference style
                  ${serialize(Options.linkReferenceStyle)}
  -p --pre        Preformatted code
                  ${serialize(Options.preformattedCode)}
  -m --remote     Enable remote fetching
  -w --raw        Save raw HTML content

Note that the first choice is default for each options.

Examples:
  turndown-cli -h
  turndown-cli sample.html
  turndown-cli sample.html sample.md
  turndown-cli -t=2 -r=3 -c=2 -f=1 -s=2 sample.html
  turndown-cli -m http://www.example.com
  turndown-cli -mw http://www.example.com
    `);
} else if (argv.v || argv.version) {
    console.log(`
Turndown CLI
Version ${appVersion}
Copyright (c) ${copyrightYear} Abhishek Kumar
Licensed under MIT License
    `);
} else {
    var sourcePath = argv._[0];
    if (!!sourcePath) {
        if (argv.m || argv.remote) {
            if (sourcePath.startsWith('http://') || sourcePath.startsWith('https://')) {
                (async () => {
                    const playwright = await import('playwright');
                    const content = await fetchContentFromUrl(sourcePath, playwright);
                    if (argv.raw || argv.w) {
                        let targetFilename = path.basename(sourcePath, path.extname(sourcePath)) + '.html';
                        var defaultTargetPath = path.join(process.cwd(), targetFilename);
                        var targetPath = argv._[1] || defaultTargetPath;
                        fs.writeFile(targetPath, content, err => {
                            if (err) {
                                console.error(err);
                                return;
                            }
                            console.log(`Raw HTML saved at path
  Relative: ${path.relative(process.cwd(), targetPath)}
  Absolute: ${targetPath}`);
                        });
                    } else {
                        var turndownService = new TurndownService();
                        var markdown = turndownService.turndown(content);
                        let targetFilename = path.basename(sourcePath, path.extname(sourcePath)) + '.md';
                        var defaultTargetPath = path.join(process.cwd(), targetFilename);
                        var targetPath = argv._[1] || defaultTargetPath;
                        fs.writeFile(targetPath, markdown, err => {
                            if (err) {
                                console.error(err);
                                return;
                            }
                            console.log(`Markdown saved at path
  Relative: ${path.relative(process.cwd(), targetPath)}
  Absolute: ${targetPath}`);
                        });
                    }
                })().catch(error => {
                    console.error('Error fetching content:', error);
                });
            } else {
                sourcePath = path.resolve(sourcePath);
                let targetFilename = path.basename(sourcePath, path.extname(sourcePath)) + '.md';
                var defaultTargetPath = path.join(path.dirname(sourcePath), targetFilename);
                var targetPath = argv._[1] || defaultTargetPath;

                var options = {};

                if (argv.head || argv.t) {
                    let optVal = argv.head || argv.t;
                    optVal = +optVal - 1;
                    if (optVal < Options.headingStyle.length) {
                        options.headingStyle = Options.headingStyle[optVal];
                    }
                }
                if (argv.hr || argv.r) {
                    let optVal = argv.hr || argv.r;
                    optVal = +optVal - 1;
                    if (optVal < Options.hr.length) {
                        options.hr = Options.hr[optVal];
                    }
                }
                if (argv.bullet || argv.b) {
                    let optVal = argv.bullet || argv.b;
                    optVal = +optVal - 1;
                    if (optVal < Options.bulletListMarker.length) {
                        options.bulletListMarker = Options.bulletListMarker[optVal];
                    }
                }
                if (argv.code || argv.c) {
                    let optVal = argv.code || argv.c;
                    optVal = +optVal - 1;
                    if (optVal < Options.codeBlockStyle.length) {
                        options.codeBlockStyle = Options.codeBlockStyle[optVal];
                    }
                }
                if (argv.fence || argv.f) {
                    let optVal = argv.fence || argv.f;
                    optVal = +optVal - 1;
                    if (optVal < Options.fence.length) {
                        options.fence = Options.fence[optVal];
                    }
                }
                if (argv.em || argv.e) {
                    let optVal = argv.em || argv.e;
                    optVal = +optVal - 1;
                    if (optVal < Options.emDelimiter.length) {
                        options.emDelimiter = Options.emDelimiter[optVal];
                    }
                }
                if (argv.strong || argv.s) {
                    let optVal = argv.strong || argv.s;
                    optVal = +optVal - 1;
                    if (optVal < Options.strongDelimiter.length) {
                        options.strongDelimiter = Options.strongDelimiter[optVal];
                    }
                }
                if (argv.link || argv.l) {
                    let optVal = argv.link || argv.l;
                    optVal = +optVal - 1;
                    if (optVal < Options.linkStyle.length) {
                        options.linkStyle = Options.linkStyle[optVal];
                    }
                }
                if (argv.linkref || argv.u) {
                    let optVal = argv.linkref || argv.u;
                    optVal = +optVal - 1;
                    if (optVal < Options.linkReferenceStyle.length) {
                        options.linkReferenceStyle = Options.linkReferenceStyle[optVal];
                    }
                }
                if (argv.pre || argv.p) {
                    let optVal = argv.pre || argv.p;
                    optVal = +optVal - 1;
                    if (optVal < Options.preformattedCode.length) {
                        options.preformattedCode = Options.preformattedCode[optVal];
                    }
                }

                var turndownService = new TurndownService(options);

                fs.readFile(sourcePath, 'utf8', (err, data) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    try {
                        var markdown = turndownService.turndown(data);
                    } catch (e) {
                        console.log(`Error: Something went wrong while conversion.`, e);
                    }
                    if (!!markdown) {
                        fs.writeFile(targetPath, markdown, err => {
                            if (err) {
                                console.error(err);
                                return;
                            }
                            console.log(`Markdown saved at path
  Relative: ${path.relative(process.cwd(), targetPath)}
  Absolute: ${targetPath}`);
                        });
                    }
                });
            }
        } else {
            sourcePath = path.resolve(sourcePath);
            let targetFilename = path.basename(sourcePath, path.extname(sourcePath)) + '.md';
            var defaultTargetPath = path.join(path.dirname(sourcePath), targetFilename);
            var targetPath = argv._[1] || defaultTargetPath;

            var options = {};

            if (argv.head || argv.t) {
                let optVal = argv.head || argv.t;
                optVal = +optVal - 1;
                if (optVal < Options.headingStyle.length) {
                    options.headingStyle = Options.headingStyle[optVal];
                }
            }
            if (argv.hr || argv.r) {
                let optVal = argv.hr || argv.r;
                optVal = +optVal - 1;
                if (optVal < Options.hr.length) {
                    options.hr = Options.hr[optVal];
                }
            }
            if (argv.bullet || argv.b) {
                let optVal = argv.bullet || argv.b;
                optVal = +optVal - 1;
                if (optVal < Options.bulletListMarker.length) {
                    options.bulletListMarker = Options.bulletListMarker[optVal];
                }
            }
            if (argv.code || argv.c) {
                let optVal = argv.code || argv.c;
                optVal = +optVal - 1;
                if (optVal < Options.codeBlockStyle.length) {
                    options.codeBlockStyle = Options.codeBlockStyle[optVal];
                }
            }
            if (argv.fence || argv.f) {
                let optVal = argv.fence || argv.f;
                optVal = +optVal - 1;
                if (optVal < Options.fence.length) {
                    options.fence = Options.fence[optVal];
                }
            }
            if (argv.em || argv.e) {
                let optVal = argv.em || argv.e;
                optVal = +optVal - 1;
                if (optVal < Options.emDelimiter.length) {
                    options.emDelimiter = Options.emDelimiter[optVal];
                }
            }
            if (argv.strong || argv.s) {
                let optVal = argv.strong || argv.s;
                optVal = +optVal - 1;
                if (optVal < Options.strongDelimiter.length) {
                    options.strongDelimiter = Options.strongDelimiter[optVal];
                }
            }
            if (argv.link || argv.l) {
                let optVal = argv.link || argv.l;
                optVal = +optVal - 1;
                if (optVal < Options.linkStyle.length) {
                    options.linkStyle = Options.linkStyle[optVal];
                }
            }
            if (argv.linkref || argv.u) {
                let optVal = argv.linkref || argv.u;
                optVal = +optVal - 1;
                if (optVal < Options.linkReferenceStyle.length) {
                    options.linkReferenceStyle = Options.linkReferenceStyle[optVal];
                }
            }
            if (argv.pre || argv.p) {
                let optVal = argv.pre || argv.p;
                optVal = +optVal - 1;
                if (optVal < Options.preformattedCode.length) {
                    options.preformattedCode = Options.preformattedCode[optVal];
                }
            }

            var turndownService = new TurndownService(options);

            fs.readFile(sourcePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(err);
                    return;
                }
                try {
                    var markdown = turndownService.turndown(data);
                } catch (e) {
                    console.log(`Error: Something went wrong while conversion.`, e);
                }
                if (!!markdown) {
                    fs.writeFile(targetPath, markdown, err => {
                        if (err) {
                            console.error(err);
                            return;
                        }
                        console.log(`Markdown saved at path
  Relative: ${path.relative(process.cwd(), targetPath)}
  Absolute: ${targetPath}`);
                    });
                }
            });
        }
    } else {
        console.log(`Error: Missing 'source' filepath param`);
    }
}