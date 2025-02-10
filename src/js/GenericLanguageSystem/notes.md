# Generic Language System

## Notes

<hr/> 

### Working Assumptions

Valid Source Data
- UTF-8 Text
- 

<hr/> 

### Components

Parser
- Layers of Tokenization
  - [Initial Ingest with 1-to-1 Source-to-Symbol Tokenization]()
    - Raw Text => Valid Char Symbol Tokenization

- Tokenization Layers Loop Until:
  - **Failure**: Rules are exhausted ***OR***
  - **Success**: Match Valid Final State

- This represents ***States*** and ***State Transitions***
  - ***States*** are the layers
    - Current State is Current Layer
    - Current Layer is a Set Of Valid Rules


Expression Builder
  - Definable Valid Expressions 
  - Another

<hr>

### Parser

#### Initial Ingest with 1-to-1 Source-to-Symbol Tokenization

> *Shorthand* => **Source Tokenization**


<hr/>

### Tokenization Layers


<hr/> 


### Working Reference Examples



<hr/> 

## GPT Refactor Settings

### Meta-Instructions

When instructed to refactor javascript scripts, use modern ES6 styles, standards, and best-practices. At a minimum, refactored JS will change prototypes to classes, replace all JQuery with modern equivalents, and use BEM style class names and other attribute names/values in HTML, CSS, and JS locations. Try to always refactor hard-coded strings to class or file constants. Introduce enums where sensible and practical. Use verbose naming in the JS scripts to be explicit and clear and enhance readability. Include JDoc comments in all generated code.

