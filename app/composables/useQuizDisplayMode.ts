export function useQuizDisplayMode(){
  const quizDisplayMode = ref<'DEFINITION' | 'TRANSLATION'>('DEFINITION')

  watch(quizDisplayMode, () => {
    localStorage.setItem('quizDisplayMode', quizDisplayMode.value)
  });

  onMounted(() => {
    const savedMode = localStorage.getItem('quizDisplayMode') as 'DEFINITION' | 'TRANSLATION' | null
    if (savedMode) quizDisplayMode.value = savedMode
  })

  let items = [
    { label: 'Definitions', value: 'DEFINITION' }, 
    { label: 'Translations', value: 'TRANSLATION' }
  ];

  return { quizDisplayMode, items }
}