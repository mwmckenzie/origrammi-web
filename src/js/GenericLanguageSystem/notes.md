# Generic Language System

## Notes

<hr> 

### Working Assumptions

Valid Source Data
- UTF-8 Text
- 

<hr> 

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


<hr>

### Tokenization Layers

State Machines



<hr> 


### Working Reference Examples

*Notes*

- Plain text

> **Source**
```
This is  source   text!
  With a tab (and a set of "quotes")
```

<br>

*Notes*

- First stage looks roughly the same
- Translated to a token per char
- Allows for identifying illegal chars per initial rules
- Note we have extra spaces in some text

> **Char Symbol Tokens**
```
UpperT LowerH LowerI LowerS SpaceChar LowerI LowerS SpaceChar SpaceChar 
LowerS LowerO LowerU LowerR LowerC LowerE SpaceChar SpaceChar SpaceChar 
LowerT LowerE LowerX LowerT ExclamationMarkChar UnixLineFeedChar SpaceChar 
SpaceChar UpperW LowerI LowerT LowerH SpaceChar LowerA SpaceChar LowerT 
LowerA LowerB SpaceChar LeftParenthesisChar LowerA LowerN LowerD SpaceChar 
LowerA SpaceChar LowerS LowerE LowerT SpaceChar LowerO LowerF SpaceChar 
QuotationMarkChar LowerQ LowerU LowerO LowerT LowerE LowerS QuotationMarkChar 
RightParenthesisChar
```

<br>

*Notes*

- Consider a 'clean-up' layer between each evaluation state?

<hr> 

<br>

## Pattern System

### What about just a pattern system?

Examples
```
This is some text: "text goes here"


Pattern: empty string literal

[[QuotationMarkChar], [QuotationMarkChar]]


Pattern: string literal

[StartWith:[QuotationMarkChar], ContinueWhile:[Token], StopOn:[QuotationMarkChar]]

```

<hr>

## GPT Refactor Settings

### Meta-Instructions

When instructed to refactor javascript scripts, use modern ES6 styles, standards, and best-practices. At a minimum, refactored JS will change prototypes to classes, replace all JQuery with modern equivalents, and use BEM style class names and other attribute names/values in HTML, CSS, and JS locations. Try to always refactor hard-coded strings to class or file constants. Introduce enums where sensible and practical. Use verbose naming in the JS scripts to be explicit and clear and enhance readability. Include JDoc comments in all generated code.


## Taxonomy

Token:
  - Word
    - AlphaNumericWord
    - AlphaOnlyWord
      - Keyword
        - AndKeyword
        - OrKeyword
        - NotKeyword
        - OneOrMore
  - Number
    - IntegerNumber
    - DecimalNumber
  - Symbol
    - ColonSymbol
    - SemiColonSymbol
    - DecimalSymbol
    - 
  - StringLiteral

Token:
  Meta:
    Error:
      UnclosedStringError:
  Literal:
    CharSequenceLiteral:
      WhiteSpaceLiteral:
      OperatorLiteral:
        MathOperatorLiteral:
      StringLiteral:
      NumberLiteral:
        IntegerLiteral:
        FloatLiteral:
      CodeWordLiteral:
        WordLiteral:
          LetterCharSequenceLiteral:
            BooleanLiteral:
              BoolTrueLiteral:
              BoolFalseLiteral:
            NullLiteral:
  CharLiteral:
    AlphaNumericChar:
      LetterChar:
        UppercaseLetterChar:
        LowercaseLetterChar:
        TitlecaseLetterChar:
        ModifierLetterChar:
        OtherLetterChar:
      NumberChar:
        DecimalDigitNumberChar:
        LetterNumberChar:
        OtherNumberChar:
    MarkChar:
      NonSpacingMarkChar:
      SpacingCombiningMarkChar:
      EnclosingMarkChar:
    SeparatorChar:
      SpaceSeparatorChar:
      LineSeparatorChar:
      ParagraphSeparatorChar:
    SpecialChar:
      ControlChar:
      FormatChar:
      SurrogateChar:
      PrivateUseChar:
    PunctuationChar:
      ConnectorPunctuationChar:
      DashPunctuationChar:
      OpenPunctuationChar:
      ClosePunctuationChar:
      InitialQuotePunctuationChar:
      FinalQuotePunctuationChar:
      OtherPunctuationChar:
    SymbolChar:
      MathSymbolChar:
      CurrencySymbolChar:
      ModifierSymbolChar:
      OtherSymbolChar:
    OtherNotAssignedChar:

## Rules / Definitions / etc

###

Token:
- Word
  - AlphaNumericWord
  - AlphaOnlyWord
    - Keyword 
      - AndKeyword
      - OrKeyword
      - NotKeyword
      - OneOrMore
- Letter
  - UppercaseLetter
  - LowercaseLetter
- Number
  - IntegerNumber
  - DecimalNumber
- Symbol
  - DefinitionAssignmentSymbol
  - LineEndSymbol
  - DecimalSymbol
  - GroupSymbol
    - GroupStartSymbol
    - GroupEndSymbol
- StringLiteral
- WhiteSpace
  - SpaceChar
- Group
  - EmptyGroup
  - PopulatedGroup

- Function
- Definition


### Processing Order

STEP 1: LexSymbolsFromSource()

STEP 2:

- StringLiteral = [QuotationMarkChar, OneOrMore(Not(QuotationMarkChar)), QuotationMarkChar]


- IntegerNumber = OneOrMore(DecimalDigitNumberChar)
- DecimalNumber = [IntegerNumber, DecimalSymbol, IntegerNumber]


- PatternKeyword = ["UpperP","LowerA","LowerT","LowerT","LowerE","LowerR","LowerN"]
- AndKeyword = [UpperA, LowerN, LowerD]
- OrKeyword = [UpperO, LowerR]
- NotKeyword = [UpperN, LowerO, LowerT]
- OneOrMoreKeyword = [UpperO, LowerN, LowerE, UpperO, LowerR, UpperM, LowerO, LowerR, LowerE]



- AlphaOnlyWord = OneOrMore(Letter)
- AlphaNumericWord = [Letter, OneOrMore(Or(Letter, IntegerNumber))]



- DefinitionAssignmentSymbol = [ColonChar]
- LineEndSymbol = [SemiColonChar]
- DecimalSymbol = [PeriodChar]
- GroupStartSymbol = [LeftParenthesisChar]
- GroupEndSymbol = [RightParenthesisChar]


- WhiteSpace => Drop()
- CommaChar => Drop()


- VoidGroup = [GroupStartSymbol, GroupEndSymbol]
- PopulatedGroup = [GroupStartSymbol, OneOrMore(Not(GroupSymbol)), GroupEndSymbol]


- Function = [Keyword, Group]


- Definition = [Word, DefinitionAssignmentSymbol, Function, LineEndSymbol]


### 

StringLiteral:
Pattern(QuotationMarkChar, OneOrMore(Not(QuotationMarkChar)), QuotationMarkChar);

Word DefinitionAssignmentSymbol Keyword

*Patterns to Match* =>



