export function useQuizDisplayMode(){
  const quizDisplayMode = ref<'DEFINITION' | 'TRANSLATION' | 'TRANSLATION_INPUT'>('DEFINITION')

  watch(quizDisplayMode, () => {
    localStorage.setItem('quizDisplayMode', quizDisplayMode.value)
  });

  onMounted(() => {
    const savedMode = localStorage.getItem('quizDisplayMode') as 'DEFINITION' | 'TRANSLATION' | 'TRANSLATION_INPUT' | null
    if (savedMode) quizDisplayMode.value = savedMode
  })

  let items = [
    { label: 'Definitions', value: 'DEFINITION' }, 
    { label: 'Translations', value: 'TRANSLATION' }, 
    { label: 'Translation input', value: 'TRANSLATION_INPUT' }
  ];

  return { quizDisplayMode, items }
}