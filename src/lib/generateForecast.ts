import { FreeForecast, PaidForecast, BirthData } from '@/store/forecastStore';

// Mock forecast generator - in production, this would call OpenAI
export const generateForecast = async (
  birthData: BirthData
): Promise<{ free: FreeForecast; paid: PaidForecast }> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2500));

  // Generate personalized-feeling content based on birth data
  const birthDate = new Date(birthData.birthDate);
  const month = birthDate.getMonth();
  
  const seasonalThemes = [
    'renewal and fresh beginnings',
    'steady growth and foundation building', 
    'creative expression and communication',
    'nurturing connections and home',
    'bold self-expression and courage',
    'refinement and attention to detail',
    'harmonious partnerships and balance',
    'deep transformation and insight',
    'expansion and adventure',
    'ambitious achievement and structure',
    'innovation and community',
    'intuition and spiritual depth'
  ];

  const theme = seasonalThemes[month];

  const free: FreeForecast = {
    overallTheme: `2026 marks a year of ${theme} for you. The patterns of time suggest this is a pivotal period where seeds planted in previous years begin to flourish. You're entering a cycle that rewards patience, intentionality, and trust in your own rhythms. This year asks you to honor both your ambitions and your need for restoration.`,
    bestMonths: [
      'March brings powerful momentum for new initiatives and personal breakthroughs.',
      'June offers exceptional clarity for important decisions and relationship deepening.',
      'September opens windows of opportunity for career advancement and recognition.',
      'November supports financial growth and long-term planning.'
    ],
    watchfulMonths: [
      'February may bring some tension—slow down and avoid hasty decisions.',
      'July calls for extra rest; don\'t push against resistance.',
      'October requires careful communication in close relationships.'
    ],
    focusAreas: {
      career: 'Your professional path this year favors depth over breadth. Rather than chasing every opportunity, focus on mastering your craft and building genuine expertise. The second half of 2026 brings recognition for efforts made in the first half.',
      relationships: 'Connections deepen when you prioritize quality time and honest dialogue. Some relationships may naturally evolve or conclude—trust this process. New bonds formed this year have lasting potential.',
      energy: 'Your vitality follows seasonal rhythms more closely than usual. Spring and early autumn are your power periods. Summer asks for more restorative practices. Listen to your body\'s subtle signals.'
    }
  };

  const paid: PaidForecast = {
    quarterlyGuidance: {
      q1: 'January through March sets your annual foundation. The first three weeks of January favor introspection and planning. From late January onward, energy builds steadily. March is your launch window—initiatives started here gain natural momentum. Focus on one significant project rather than scattering your efforts.',
      q2: 'April through June emphasizes relationships and collaborative ventures. This quarter tests your ability to balance independence with partnership. May brings unexpected opportunities through your network. June\'s clarity is exceptional—use it for any decisions you\'ve been postponing.',
      q3: 'July through September shifts focus to inner work and then outward achievement. July\'s slower pace serves a purpose—use it for learning and skill development. August rebuilds momentum. September rewards those who prepared during the quieter months with visible success.',
      q4: 'October through December completes major cycles. October requires diplomatic skill. November brings financial focus and opportunities for growth. December offers reflection and gratitude, plus seeds for 2027\'s ventures.'
    },
    timingWindows: [
      'March 8-22: Exceptional for launching projects, signing agreements, or making bold moves.',
      'May 15-28: Network expansion and collaborative opportunities peak.',
      'June 1-15: Ideal for major decisions, especially regarding home or family.',
      'September 5-20: Career advancement and recognition most likely.',
      'November 10-25: Financial decisions and investments favored.'
    ],
    energyManagement: 'Your energy this year moves in six-week cycles. Notice how you feel in mid-January, late February, early April, and so on. These transition points are ideal for adjusting your pace. The weeks of highest vitality are best for external action; lower periods serve reflection and planning. Don\'t fight your natural rhythm—work with it.',
    patternWarnings: [
      'Around February 14-21, avoid making permanent decisions about relationships or finances.',
      'The week of July 8-15 may bring technology or communication challenges—back up important data and speak carefully.',
      'October 1-10 may surface old patterns in close relationships—respond rather than react.',
      'Mercury\'s retrograde periods (March 10-31, July 15-August 8, November 5-25) favor revision over initiation.'
    ],
    closingGuidance: 'This year ultimately teaches you to trust your own timing. Not everything needs to happen immediately, and not every opportunity is meant for you. The patterns suggest that your greatest growth comes from choosing depth, maintaining patience, and honoring your unique rhythm. By December 2026, you\'ll understand why certain things unfolded as they did. Trust the process, honor your energy, and remember: you are exactly where you need to be.'
  };

  return { free, paid };
};
