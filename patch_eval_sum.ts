    case 'Summation': {
      const lowerBound = evaluate(node.lowerBound, options);
      const upperBound = evaluate(node.upperBound, options);
      if (typeof lowerBound !== 'number' || typeof upperBound !== 'number') {
         throw new EvaluationError("Summation bounds must be real numbers");
      }
      let sum = 0;
      for (let i = lowerBound; i <= upperBound; i++) {
        const iterOptions = { ...options, variables: { ...options?.variables, [node.indexVariable]: i } };
        const val = evaluate(node.expression, iterOptions);
        if (typeof val !== 'number') {
          throw new EvaluationError("Summation body must evaluate to a real number");
        }
        sum += val;
      }
      return cleanFloat(sum);
    }
