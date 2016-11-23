'use strict';
var fs = require('fs-extra')
var cwpmMarkDown = require('../markDown');
var cwpmRepository = require('../repository');
var cwpmZip = require('../zip');
var cwpmFile = require('../file');
var cwpmURL = require('../url');
var semver = require('semver')
var findVersions = require('find-versions');

function install(optionsInstall) {
    cwpmURL.getJsonFile("https://raw.githubusercontent.com/casewise/evolve-layouts/master/layouts.json?" + Math.random(), function(err, layouts) {
        if (optionsInstall != true && !layouts.hasOwnProperty(optionsInstall)) {
            console.error('the layout you try to install do not exist'.red);
            listALLlayouts(layouts)
            return;
        } else if (!fs.existsSync("./evolve.json")) {
            console.log('creating evolveJson'.green);
            var evolveJson = createEvolveJson(optionsInstall);
            listALLlayouts(layouts)
        } else {
            var evolveJson = JSON.parse(fs.readFileSync('./evolve.json', 'utf8'));
            if (optionsInstall !== true) {
                evolveJson.dependencies[optionsInstall] = "^0.0.1";
            } else {
                listALLlayouts(layouts)
                console.log("Update the existing Layouts");
            }
        }
        cwpmFile.writeInFile("./evolve.json", JSON.stringify(evolveJson, null, 4));
        installLayouts(evolveJson, layouts);
    });
}

function listALLlayouts(layouts) {
    console.log('here is the list of all layouts'.green);
    for (var layout in layouts) {
        if (layouts.hasOwnProperty(layout)) {
            console.log((layouts[layout].name + ' : ' + layouts[layout].description));
        }
    }
}

function installLayouts(evolveJson, layouts) {
    for (var layoutName in evolveJson.dependencies) {
        if (evolveJson.dependencies.hasOwnProperty(layoutName)) {
            console.log("get layout : " + layoutName);
            if (layouts[layoutName] && layouts[layoutName]['evolve-versions']) {
                var fileUrl = findSatisfayingVersion(layouts[layoutName]['evolve-versions'], evolveJson['evolve-version']);
                if (fileUrl !== undefined) {
                    console.log(('get file ' + fileUrl).green);
                    cwpmURL.getRawFileContent(fileUrl, cwpmZip.UnzipLayout, layoutName);
                } else {
                    console.error(['impossible to find ', layoutName, ' for current version of evolve which is ', evolveJson['evolve-version']].join('').red);
                }
            }
        }
    }
}

function findSatisfayingVersion(layout, versionToSatisfy) {
    for (var version in layout) {
        if (layout.hasOwnProperty(version)) {
            var sVersions = findVersions(version, {loose: true});        
            var sVersionToSatisfys = findVersions(versionToSatisfy, {loose: true});
            if(sVersions[0] && sVersionToSatisfys[0] && semver.minor(sVersionToSatisfys[0]) == semver.minor(sVersions[0])) {
                return layout[version]; 
            }
        }
    }
    return null;
}


function createEvolveJson(layout) {
    var evolveJson = {};
    evolveJson["evolve-version"] = getEvolveVersion();
    evolveJson["dependencies"] = {};
    if(layout !== true) {
        evolveJson.dependencies[layout] = "^0.0.1";
    }
    return evolveJson;
}

function getEvolveVersion() {
    const vi = require('win-version-info')
    return vi("evolveDesigner.exe").FileVersion;
}

module.exports = {
    install
}