<script setup lang="ts">
import type { DailyCompleted, DailySections } from '@prisma/client';
import moment from 'moment';

type DailyResponse = {
  date: string;
  sectionsCount: number;
  sectionsCompletedCount: number;
  sections: DailySections[];
  compeletedToday: DailyCompleted[];
};


let data = reactive<{
  loading: boolean;
  data: DailyResponse | null;
}>({
  loading: true,
  data: null
});

async function load(){
  try {
    data.loading = true;
    data.data = await $fetch<DailyResponse>('/api/daily')
  } catch (error) {
    console.error('Error loading daily data:', error)
    alert('Failed to load daily data. Please try again.')
  } finally {
    data.loading = false;
  }
}

onMounted(()=>{
  load();
});

const screen = ref<'start'|'task'>('start');
const section = reactive({
  sectionKey: '' as '' | 'vocab' | 'recap' | 'interview' | 'fluency',
  startedAt: 0,
  endedAt: 0,
  target: {} as any,
  complited: false,
  autoEnd: false
});

function startSection(){
  let nextSection = data.data?.sections[data.data.sectionsCompletedCount];
  if(!nextSection) return;
  section.sectionKey = nextSection.sectionKey as typeof section.sectionKey;
  section.target = nextSection.target;
  section.startedAt = Date.now();
  section.complited = false;
  section.autoEnd = nextSection.autoEnd;
  screen.value = 'task';
}

function submitHandler({submittedCount, correct}: {submittedCount: number, correct: boolean}){
  let completedConditions: boolean[] = [];

  for(let i = 0; i < Object.keys(section.target).length; i++){
    let key = Object.keys(section.target)[i]!;
    let value = section.target[key];

    if(key == 'submittedCount'){
      completedConditions.push(submittedCount >= value);
    } else if(key == 'correct'){
      completedConditions.push(correct == true);
    } else {
      console.warn('Unknown target key:', key);
    }
  }

  if(completedConditions.every(c => c === true)){
    section.complited = true;
    if(section.autoEnd){
      endSection();
    }
  }
}

function endSection(){
  section.endedAt = Date.now();
  screen.value = 'start';

  // todo: write completion to backend
  // todo: show completeion screen

  load();
}

onUnmounted(() => {

})
</script>

<template>
  <main class="wrap">
    <UPageBody>
      <UCard variant="subtle" v-if="data.loading">
        <Loader/>
      </UCard>
      <template v-else>
        <template v-if="data.data?.sectionsCount == 0">
          <UCard variant="subtle">
            <p>No sections for today. Please check back later.</p>
          </UCard>
        </template>
        <template v-else>
          <template v-if="data.data?.sectionsCount !== data.data?.sectionsCompletedCount">
            <div class="dailyTitle">Daily Workout ✨ {{ moment(data.data?.date).format('YYYY.MM.DD') }} 🌟</div>
            <UCard variant="subtle" v-if="screen == 'start'">
              <template v-if="data.data?.sectionsCompletedCount == 0">
                <p>Today's workout consists of {{ data.data?.sectionsCount }} sections.
                  <br>
                  Let's get started!</p>
                <br>
                First section - <b>{{ data.data?.sections[0]!.name }}</b>
                <br>
                <UButton color="primary" class="mt-3" @click="startSection()">Start workout</UButton>
              </template>
              <template v-else>
                You have completed {{ data.data?.sectionsCompletedCount }} out of {{ data.data?.sectionsCount }} sections today.
                <br>
                Keep going to complete the workout!
                <br>
                <br>
                Next section - <b>{{ data.data?.sections[data.data?.sectionsCompletedCount]!.name }}</b>
                <br>
                <UButton color="primary" class="mt-3" @click="startSection()">Continue workout</UButton>
              </template>
            </UCard>
            <template v-else-if="screen == 'task'">
              <VocabTrainer @submitted="submitHandler" v-if="section.sectionKey == 'vocab'"/>
              <UCard variant="subtle" v-else>
                <p>Section {{ section.sectionKey }} is not implemented yet.</p>
              </UCard>
            </template>
          </template>
          <template v-if="data.data?.sectionsCount === data.data?.sectionsCompletedCount">
            <UCard variant="subtle" v-if="data.data?.sectionsCount === data.data?.sectionsCompletedCount">
              All sections completed!
            </UCard>
          </template>
        </template>
      </template>
    </UPageBody>
  </main>
</template>

<style scoped lang="scss">
.dailyTitle{
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 1em;
  text-align: center;
}
</style>
