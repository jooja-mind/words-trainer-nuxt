<script setup lang="ts">
import type { DailyCompleted, DailySections } from '@prisma/client';
import moment from 'moment';
import NumberFlow from '@number-flow/vue'

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

async function load(runNextSectionAfterLoad = false){
  try {
    data.loading = true;
    data.data = await $fetch<DailyResponse>('/api/daily')
    if(runNextSectionAfterLoad){
      let nextSection = getNextSection();
      if(nextSection){
        // start next section
        startSection(nextSection);
      }else{
        // completed all sections
        confetti.addConfetti();
        setTimeout(() => {
          confetti.addConfetti();
        }, 200);
        setTimeout(() => {
          confetti.addConfetti();
        }, 600);
      }
    }
  } catch (error) {
    console.error('Error loading daily data:', error)
    alert('Failed to load daily data. Please try again.')
  } finally {
    data.loading = false;
  }
}


const screen = ref<'start'|'task'|'complete'>('start');
const section = reactive({
  sectionKey: '' as '' | 'vocab' | 'recap' | 'interview' | 'fluency',
  name: '',
  startedAt: 0,
  endedAt: 0,
  target: {} as any,
  complited: false,
  autoEnd: false,
  submitted: {
    count: 0,
    correct: false
  }
});

function getNextSection(considerCurrent = false){
  if(!considerCurrent){
    return data.data?.sections[data.data.sectionsCompletedCount];
  }else{
    return data.data?.sections[data.data.sectionsCompletedCount + 1];
  }
}

function startSection(nextSection?: DailySections){
  let sectionToStart = nextSection;
  if(!sectionToStart) return;
  section.sectionKey = sectionToStart.sectionKey as typeof section.sectionKey;
  section.target = sectionToStart.target;
  section.startedAt = Date.now();
  section.complited = false;
  section.autoEnd = sectionToStart.autoEnd;
  section.submitted.count = 0;
  section.submitted.correct = false;
  section.name = sectionToStart.name;
  screen.value = 'task';
}

function submitHandler({submittedCount, correct}: {submittedCount: number, correct: boolean}){
  let completedConditions: boolean[] = [];

  if(submittedCount) section.submitted.count = submittedCount;
  if(correct) section.submitted.correct = correct;

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
    if(confetti) confetti.addConfetti({emojis: ['✅', '🟢', '💚']});
    if(section.autoEnd){
      endSection();
    }
  }
}

async function endSection(){
  section.endedAt = Date.now();

  data.loading = true;
  try {
    await $fetch('/api/daily/submit', {
      method: 'POST',
      body: {
        date: data.data?.date,
        sectionKey: section.sectionKey,
        startedAt: section.startedAt,
        endedAt: section.endedAt,
        stats: {}
      }
    })
  } catch (error) {
    console.error('Error submitting daily section:', error)
    alert('Failed to submit daily section. Please try again.')
  }

  screen.value = 'complete';
  data.loading = false;

  // load();
}

let debugSubmittedCount = ref(0);
function debugScreen(s: string){
  data.loading = false;
  if(s === 'welcome'){
    screen.value = 'start';
    data.data = {
      date: moment().format('YYYY-MM-DD'),
      sectionsCount: 2,
      sectionsCompletedCount: 0,
      sections: [
        { id: 1, orderIndex: 1, sectionKey: 'vocab', name: 'Vocab', target: { submittedCount: 5 }, autoEnd: true },
        { id: 2, orderIndex: 2, sectionKey: 'recap', name: 'Recap', target: { submittedCount: 3 }, autoEnd: false },
        { id: 3, orderIndex: 3, sectionKey: 'interview', name: 'Interview', target: { submittedCount: 1 }, autoEnd: false },
        { id: 4, orderIndex: 4, sectionKey: 'fluency', name: 'Fluency', target: { submittedCount: 1 }, autoEnd: false },
      ],
      compeletedToday: []
    }
  }else if(s === 'loading'){
    data.loading = true;
  }else if(s === 'train-vocab'){
    startSection({
      sectionKey: 'vocab',
      name: 'Vocab',
      target: { submittedCount: 5 },
      autoEnd: true
    } as any);
  }else if(s === 'complete'){
    section.sectionKey = 'vocab';
    section.complited = true;
    screen.value = 'complete';
  }else if(s === 'train-recap'){
    startSection({
      sectionKey: 'recap',
      name: 'Recap',
      target: { submittedCount: 3 },
      autoEnd: false
    } as any);
  }else if(s === 'train-interview'){
    startSection({
      sectionKey: 'interview',
      name: 'Interview',
      target: { correct: true },
      autoEnd: false
    } as any);
  }else if(s === 'train-fluency'){
    startSection({
      sectionKey: 'fluency',
      name: 'Fluency',
      target: { submittedCount: 1 },
      autoEnd: false
    } as any);
  }else if(s === 'emit-submitted-1-f'){
    debugSubmittedCount.value++;
    submitHandler({ submittedCount: debugSubmittedCount.value, correct: false });
  }else if(s === 'emit-submitted-1-t'){
    debugSubmittedCount.value++;
    submitHandler({ submittedCount: debugSubmittedCount.value, correct: true });
  }else if(s === 'clear-submitted'){
    debugSubmittedCount.value = 0;
    section.submitted.count = 0;
    section.submitted.correct = false;
    section.complited = false;
  }else if(s === 'allCompleted'){
    data.data = {
      date: moment().format('YYYY-MM-DD'),
      sectionsCount: 2,
      sectionsCompletedCount: 2,
      sections: [
        { id: 1, orderIndex: 1, sectionKey: 'vocab', name: 'Vocab', target: { submittedCount: 5 }, autoEnd: true },
        { id: 2, orderIndex: 2, sectionKey: 'recap', name: 'Recap', target: { submittedCount: 3 }, autoEnd: false },
      ],
      compeletedToday: [
        { id: 1, sectionKey: 'vocab', date: moment().format('YYYY-MM-DD'), completedInSeconds: 120, startedAt: new Date(), endedAt: new Date(), stats: {} },
        { id: 2, sectionKey: 'recap', date: moment().format('YYYY-MM-DD'), completedInSeconds: 300, startedAt: new Date(), endedAt: new Date(), stats: {} },
      ]
    }
    screen.value = 'complete';
  }
}

function secondsToHumanTime(seconds: number){
  if(seconds < 60) return `${seconds}s`;
  let minutes = Math.floor(seconds / 60);
  seconds = seconds % 60;
  if(minutes < 60) return `${minutes}m ${seconds}s`;
  let hours = Math.floor(minutes / 60);
  minutes = minutes % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

let isLocalhost = ref(false);
let confetti: any = null;
onMounted(()=>{
  if(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'){
    isLocalhost.value = true;
  }
  confetti = new (window as any).JSConfetti();
  load();
});

onUnmounted(() => {

})
</script>

<template>
  <main class="wrap">
    <UPageBody>
      <Loader v-if="data.loading" style="margin: 0 auto;"/>
      <template v-else>
        <template v-if="data.data?.sectionsCount == 0">
          <UCard variant="subtle">
            <p>No sections for today. Please check back later.</p>
          </UCard>
        </template>
        <template v-else>
          <template v-if="data.data?.sectionsCount !== data.data?.sectionsCompletedCount">
            <div class="dailyTitle">
              Daily Workout
              <br>
              ✨ {{ moment(data.data?.date).format('YYYY.MM.DD') }} 🌟
            </div>
            <div v-if="screen == 'start'">
              <template v-if="data.data?.sectionsCompletedCount == 0">
                <div class="welcome">
                  <p>Today's workout consists of {{ data.data?.sectionsCount }} sections.
                    <br>
                    Let's get started!</p>
                  <br>
                  First section - <b>{{ data.data?.sections[0]!.name }}</b>
                  <br>
                  <UButton color="primary" icon="ant-design:thunderbolt-filled" class="mt-6" @click="startSection(getNextSection())">Start Workout!</UButton>
                </div>
              </template>
              <template v-else>
                <div class="welcome">
                  You have completed {{ data.data?.sectionsCompletedCount }} out of {{ data.data?.sectionsCount }} sections today.
                  <br>
                  Keep going to complete the workout!
                  <br>
                  <br>
                  Next section - <b>{{ data.data?.sections[data.data?.sectionsCompletedCount]!.name }}</b>
                  <br>
                  <UButton color="primary" icon="codicon:debug-continue" class="mt-6" @click="startSection(getNextSection())">Continue Workout!</UButton>
                </div>
              </template>
            </div>
            <template v-else-if="screen == 'task'">
              <div class="sectionName">
                {{ section.name }}
              </div>
              <div class="targets">
                <div class="submittedCount" v-if="Object.hasOwn(section.target, 'submittedCount')" :class="{done: section.submitted.count >= section.target.submittedCount}">
                  <NumberFlow :value="section.submitted.count" :suffix="` / ${section.target.submittedCount}`" />
                </div>
                <div class="correct" v-if="Object.hasOwn(section.target, 'correct')" :class="{done: !!section.submitted.correct}">
                  <div class="waiting" v-if="!section.submitted.correct">
                    Waiting for correct answer...
                  </div>
                  <div class="passed" v-if="section.submitted.correct">
                    Successfully Passed!
                  </div>
                </div>
              </div>
              <VocabTrainer @submitted="submitHandler" v-if="section.sectionKey == 'vocab'"/>
              <RecapTrainer @submitted="submitHandler" v-else-if="section.sectionKey == 'recap'"/>
              <InterviewTrainer @submitted="submitHandler" v-else-if="section.sectionKey == 'interview'"/>
              <FluencyTrainer @submitted="submitHandler" v-else-if="section.sectionKey == 'fluency'"/>
              <UCard variant="subtle" v-else>
                <p>Section {{ section.sectionKey }} is not implemented yet.</p>
              </UCard>
              <div class="mannualEnd" v-if="section.complited">
                <UButton @click="endSection" color="success" size="xl">Done — End section!</UButton>
              </div>
            </template>
            <template v-else-if="screen == 'complete'">
              <div class="congrats">
                <div class="party">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Lucide by Lucide Contributors - https://github.com/lucide-icons/lucide/blob/main/LICENSE --><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M5.8 11.3L2 22l10.7-3.79M4 3h.01M22 8h.01M15 2h.01M22 20h.01M22 2l-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10m8 3l-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17M11 2l.33.82c.34.86-.2 1.82-1.11 1.98c-.7.1-1.22.72-1.22 1.43V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5s-3.07-.07-5-2s-2.83-4.17-2-5s3.07.07 5 2"/></g></svg>
                </div>
                <p>
                  Yay! You have completed the <b>{{ section.name }}</b> section of today's workout!
                  <div v-if="getNextSection(true)">
                    Get ready for the next section - <b>{{ getNextSection(true)!.name }}</b>!
                  </div>
                </p>
                <UButton @click="load(true)" v-if="getNextSection(true)" size="xl">Continue!</UButton>
                <UButton @click="load(true)" v-else size="xl">End Workout!</UButton>
              </div>
            </template>
          </template>
          <template v-if="data.data?.sectionsCount === data.data?.sectionsCompletedCount">
            <div class="dailyTitle">
              Daily Workout
              <br>
              ✨ {{ moment(data.data?.date).format('YYYY.MM.DD') }} 🌟
            </div>
            <div class="completed" v-if="data.data?.sectionsCount === data.data?.sectionsCompletedCount">
              <div class="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><!-- Icon from Tabler Icons by Paweł Kuna - https://github.com/tabler/tabler-icons/blob/master/LICENSE --><path fill="currentColor" d="M17 3.34a10 10 0 1 1-14.995 8.984L2 12l.005-.324A10 10 0 0 1 17 3.34M15 13H9a1 1 0 0 0-1 1v.05a3.975 3.975 0 0 0 3.777 3.97l.227.005a4.026 4.026 0 0 0 3.99-3.79l.006-.206A1 1 0 0 0 15 13M9.01 8l-.127.007A1 1 0 0 0 9 10l.127-.007A1 1 0 0 0 9.01 8m6 0l-.127.007A1 1 0 0 0 15 10l.127-.007A1 1 0 0 0 15.01 8"/></svg>
              </div>
              <div class="text">
                All sections completed!
              </div>
              <div class="stats">
                <div class="totalTime">
                  Total time: {{ secondsToHumanTime(data.data?.compeletedToday.reduce((acc, s) => acc + (s.completedInSeconds || 0), 0) || 0) }}
                </div>
                <div class="sectionTime" v-for="completedSection of data.data?.compeletedToday" :key="completedSection.id">
                  {{ completedSection.sectionKey }} - {{ secondsToHumanTime(completedSection.completedInSeconds || 0) }}
                </div>
              </div>
            </div>
          </template>
        </template>
      </template>

      <UCard variant="outline" v-if="isLocalhost">
        Screens:
        <br>
        <UButton @click="debugScreen('welcome')" label="Welcome Screen" color="primary" variant="outline"/>
        <UButton @click="debugScreen('loading')" label="Loading Screen" color="primary" variant="outline"/>
        <UButton @click="debugScreen('complete')" label="Complete Screen" color="primary" variant="outline"/>
        <UButton @click="debugScreen('allCompleted')" label="All Completed Screen" color="primary" variant="outline"/>
        <br>
        <UButton @click="debugScreen('train-vocab')" label="Train Vocab Screen" color="primary" variant="outline"/>
        <br>
        <UButton @click="debugScreen('train-recap')" label="Train Recap Screen" color="primary" variant="outline"/>
        <br>
        <UButton @click="debugScreen('train-interview')" label="Train Interview Screen" color="primary" variant="outline"/>
        <br>
        <UButton @click="debugScreen('train-fluency')" label="Train Fluency Screen" color="primary" variant="outline"/>
        <br>
        <UButton @click="debugScreen('emit-submitted-1-f')" label="Emit Submitted +1, not correct" color="primary" variant="outline"/>
        <UButton @click="debugScreen('emit-submitted-1-t')" label="Emit Submitted +1, correct" color="primary" variant="outline"/>
        <UButton @click="debugScreen('clear-submitted')" label="Clear Submitted" color="primary" variant="outline"/>
        {{ debugSubmittedCount }}
        <hr>
        <p><b>Section Debug:</b></p>
        <p>Section key: {{ section.sectionKey }}</p>
        <p>Started at: {{ moment(section.startedAt).format('HH:mm:ss') }}</p>
        <p>Target: {{ JSON.stringify(section.target) }}</p>
        <p>Completed: {{ section.complited }}</p>
      </UCard>
    </UPageBody>
  </main>
</template>

<style scoped lang="scss">
.dailyTitle{
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 1em;
  text-align: center;
}

.sectionName{
  font-size: 40px;
  font-weight: bold;
  margin-bottom: 0px;
  text-align: center;
}

.welcome{
  text-align: center;
}

.targets{
  .submittedCount{
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 1em;
    text-align: center;
    transition: 0.3s color, 0.3s text-shadow;
    text-shadow: 0px 0px 0px rgba(255, 255, 255, 0);
    color: #3d5074;

    &.done{
      color: #4CAF50;
      text-shadow: 0px 0px 30px rgba(255, 255, 255, 0.8);
    }
  }

  .correct{
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 1em;
    text-align: center;
    transition: 0.3s color, 0.3s text-shadow;
    color: #3d5074;
    text-shadow: 0px 0px 0px rgba(255, 255, 255, 0);

    &.done{
      color: #4CAF50;
      text-shadow: 0px 0px 30px rgba(255, 255, 255, 0.8);
    }
  }
}

.congrats{
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
  margin-top: 40px;

  .party{
    color: #4CAF50;
    height: 64px;
    width: 64px;

    svg{
      width: 64px;
      height: 64px;
    }
  }

  p{
    font-size: 18px;
    max-width: 340px;
  }
}

.mannualEnd{
  display: flex;
  justify-content: center;
  position: fixed;
  background: #0e172b9c;
  width: 100%;
  left: 0;
  padding: 20px;
  padding-top: 10px;
  bottom: 0;
  margin: 0;
  overflow: hidden;
  backdrop-filter: blur(6px);
}

.completed{
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
  margin-top: 40px;

  .icon{
    color: #4CAF50;
    width: 64px;
    height: 64px;

    svg{
      width: 64px;
      height: 64px;
    }
  }

  .text{
    font-size: 18px;
    max-width: 340px;
  }
}

.stats{
  margin-top: 20px;
  font-size: 14px;
  color: #b8bfdb;

  .totalTime{
    font-weight: bold;
    margin-bottom: 10px;
  }
}

// pc display 
@media screen and (min-width: 1024px) {
  .mannualEnd{
    position: relative;
    background: none;
    width: auto;
    padding: 0;
    margin-top: 0px;
    backdrop-filter: none;
  }
}
</style>
