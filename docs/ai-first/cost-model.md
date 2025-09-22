# Cost Model – ShopLite

## Assumptions
- **Model**: GPT-4o-mini at $0.15/1K prompt tokens, $0.60/1K completion tokens  
- **Average token use**: Typeahead ~30 in / 20 out, Support assistant ~400 in / 150 out  
- **Daily volume**: 50,000 Typeahead requests, 1,000 Support assistant requests  
- **Cache efficiency**: Typeahead 70%, Support 30%  

## Calculations

**Typeahead**  
- Cost per action = (30 ÷ 1000 × $0.15) + (20 ÷ 1000 × $0.60) ≈ **$0.018**  
- Daily cost = $0.018 × 50,000 × (1 – 0.70) ≈ **$270**  

**Support Assistant**  
- Cost per action = (400 ÷ 1000 × $0.15) + (150 ÷ 1000 × $0.60) ≈ **$0.105**  
- Daily cost = $0.105 × 1,000 × (1 – 0.30) ≈ **$73.50**  

## Results
- **Typeahead**: $0.018 per action → ~$270/day  
- **Support Assistant**: $0.105 per action → ~$73.50/day  

## Cost Levers if Over Budget

### Typeahead Search Suggestions
1. **Improve caching** – lift hit rate from 70% to ~85% to reduce model calls.  
2. **Trim queries** – limit token length per request to bring down cost per action.  
3. **Model swap** – use GPT-4o-mini only where needed; switch routine queries to a lighter model (e.g., Llama 3.1 8B).  

### Support Assistant
1. **Cut context size** – reduce input from ~400 tokens closer to 200 where possible.  
2. **Tier responses** – route simple FAQs through a cheaper model; reserve GPT-4o-mini for complex issues.  
3. **Cache top answers** – store and reuse responses to the most common support questions.  
