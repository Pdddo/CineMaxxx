const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    // Fix: import { User, ... } from '../types' -> import type { User, ... } from '../types'
    content = content.replace(/import\s+{([^}]+)}\s+from\s+['"](\.\.\/types|\.\.\/\.\.\/types)['"]/g, (match, p1, p2) => {
        if (match.startsWith('import type')) return match;
        changed = true;
        return `import type { ${p1.trim()} } from '${p2}'`;
    });

    // Also fix ReactNode in AuthContext if needed:
    content = content.replace(/import\s+React,\s*{\s*createContext,\s*useContext,\s*useState,\s*useEffect,\s*ReactNode\s*}\s+from\s+['"]react['"]/, (match) => {
        changed = true;
        return `import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'`;
    });

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed', file);
    }
});
