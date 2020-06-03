grammar Spoodle;

program: statement *;

// Very important main grammar

statement
    : blockstatement
    | ifstatement
    | forstatement
    | whilestatement
    | dostatement
    | returnstatement
    | declarevar
    | exprstatement
    ;

exprstatement   : rvalue? ';' ;

blockstatement  : '{' statement* '}' ;

ifstatement     : 'if' '(' rvalue ')' s1=statement ('else' s2=statement)? ;

forstatement    : 'for' '(' (init1=declarevar | init2=exprstatement) cond=exprstatement fini=rvalue? ')' statement ;

whilestatement  : 'while' '(' rvalue ')' statement ;

returnstatement : 'return' rvalue? ';' ;

dostatement     : 'do' blockstatement 'while' '(' rvalue ')' ';' ;

declarevar      : 'let' Whitespace* identifier ('=' rvalue)? ';' ;

rvalue
    : ('(' rvalue ')')                                  # r_rvalue
    | identifier                                        # r_identifier
    | rvalue '(' functionparams? ')'                    # r_functioncall
    | literal                                           # r_literal
    | a=rvalue '?' b=rvalue ':' c=rvalue                # ternery
    | unary rvalue                                      # unaryoperation
    | left=rvalue op=incdec                             # postfixoperation
    | op=incdec right=rvalue                            # prefixoperation
    | left=rvalue op=('*' | '/' | '%')  right=rvalue    # expression
    | left=rvalue op=('+' | '-')        right=rvalue    # expression
    | left=rvalue op=CMP                right=rvalue    # expression
    | left=rvalue op=('&&' | '||')      right=rvalue    # logicalexpr
    | identifier assign rvalue                          # assignment
    | 'function' '(' functiontempl? ')' blockstatement  # inlinefuncdecl
    ;

assign: binary? '=' ;
incdec: '++' | '--' ;
unary: '!' | '-' | '#' ;
CMP : '==' | '!=' | '<' | '<=' | '>' | '>=' ;
binary: CMP | '||' | '&&' | '-' | '+' | '%' | '*' | '/' ;

// Statements

/*reservedKeyword : RESERVED ;
RESERVED        : '$emit' | '$typeof' ;*/

functiontempl   : identifier (',' identifier)* ;
functionparams  : rvalue (',' rvalue)* ;
identifier      : (prefix = '$')? name;
name            : NAME ;
NAME            : [a-zA-Z_][a-zA-Z0-9_]* ;

// String parsing

literal                 : Floating_literal | Numeric_literal | String_literal | Boolean_literal ;
Floating_literal        : DEC '.' DEC FL_SUFFIX ;
Numeric_literal         : (HEX | DEC) NM_SUFFIX? ;
Boolean_literal         : BOOLEAN;
String_literal          : STRING ;

fragment STRING         : '"' (EscapeChar | ~["\\])* '"' ;
fragment FL_SUFFIX      : [fFdD] ;
fragment NM_SUFFIX      : [bBsSlL] ;
fragment HEX            : '0' ('x'|'X') [0-9a-fA-F]+ ;
fragment DEC            : [0-9]+;
fragment BOOLEAN        : 'true' | 'false';

fragment EscapeChar     : '\\' (["\\/bfnrt] | UnicodeEscape) ;
fragment UnicodeEscape  : 'u' HexDigit HexDigit HexDigit HexDigit ;
fragment HexDigit       : [0-9a-fA-F] ;

// Whitespace Tokens

BlockComment        : '/*' .*? '*/'         -> skip ;
LineComment         : '//' ~[\r\n]*         -> skip ;
Whitespace          : (' ' | '\t')+         -> skip ;
Newline             : ('\r'? '\n' | '\r')+  -> skip ;