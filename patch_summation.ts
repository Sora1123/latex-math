      if (token.value === '\\sum') {
        let indexVariable = '';
        let lowerBound: Expression | null = null;
        let upperBound: Expression | null = null;
        if (peek().type === TokenType.Underscore) {
          consume();
          if (peek().type === TokenType.LeftBrace) {
            consume();
            const eq = parseExpression();
            if (eq.type === 'Equation' && eq.operator === '=' && eq.left.type === 'Variable') {
              indexVariable = eq.left.name;
              lowerBound = eq.right;
            } else {
              throw new LatexParseError('Expected equation in summation subscript', peek().position);
            }
            consume(TokenType.RightBrace);
          } else {
            throw new LatexParseError('Expected { after _ in \\sum', peek().position);
          }
        }
        if (peek().type === TokenType.Caret) {
          consume();
          if (peek().type === TokenType.LeftBrace) {
            consume();
            upperBound = parseExpression();
            consume(TokenType.RightBrace);
          } else {
            upperBound = parsePrimary();
          }
        }
        if (!lowerBound || !upperBound) {
          throw new LatexParseError('Summation requires lower and upper bounds', token.position);
        }
        const body = parseExpression();
        return { type: 'Summation', indexVariable, lowerBound, upperBound, expression: body };
      }
