import { Component, ElementRef, ViewChild, } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from "@angular/material/snack-bar";
import { WaiterComponent } from '../waiter/waiter.component';
import { BackendService } from "src/backend.service";
import { LocalizerService } from 'src/services/localizer.service';
import { Clipboard } from '@angular/cdk/clipboard';


export interface Lesson {
  lessonNumber: string;
  title: string;
  textareaValue: string;
}

@Component({
  selector: 'app-xgen',
  templateUrl: './xgen.component.html',
  styleUrls: ['./xgen.component.css']
})


export class XgenComponent {

  @ViewChild(WaiterComponent) waiter!: WaiterComponent;

  isXgenRoute = true;

  constructor(private snack: MatSnackBar, private router: Router, public route: ActivatedRoute,
    private backend: BackendService, ls: LocalizerService, private http: HttpClient,
    private elem: ElementRef, private clipboard: Clipboard) {
    this.ls = ls;
  }

  ls: LocalizerService;

  changeLanguage(lang: string) {
    this.ls.setLanguage(lang);
    this.selectedLanguage = lang;
    console.log(this.selectedLanguage)
  }

  public selectedLanguage: string = "english";
  public xlangs: string[] = ['Swedish', 'English'];

  validPages: string[] = ['Home', 'Add new text', 'View all texts', 'Options', 'Preview'];
  public currentPageNumber: number = 0;
  public currentPage: string = "add";

  manualLesson!: string;
  public lessons: Lesson[] = [];
  public validLessons: Lesson[] = [];
  public lessonNumber: string = "";
  public lessonTitle: string = "";
  public textareaValue: string = '';
  public processedText: boolean = false;
  public altAnswer: any[] = [];

  public generatedUrl: string = "";
  bigScreen = false;
  public onlyShowExercise = false;


  public posData: any;
  public validPos = ["AB", "DT", "HA", "HD", "HP", "HS", "IE", "IN", "JJ", "KN", "NN", "PC", "PL", "PM", "PN", "PP", "PS", "RG", "RO", "SN", "UO", "VB", "MAD", "MID"];
  public posLabels: { [key: string]: string } = {
    "AB": "Adverb",
    "DT": "Determiner",
    "IN": "Preposition",
    "JJ": "Adjective",
    "KN": "Conjunction",
    "NN": "Noun",
    "PC": "Particle",
    "PM": "Proper Noun",
    "PN": "Pronoun",
    "PP": "Personal Pronoun",
    "PS": "Possessive Pronoun",
    "RG": "Relative Adverb",
    "UO": "Interjection",
    "VB": "Verb",
  };
  public validLabels = this.validPos.filter(pos => this.posLabels[pos]);

  public uniquePos: string[] = [];
  public showValidPos: boolean = false;

  private disabledNumbers: any = [];
  isChecked: { [key: string]: boolean } = {};

  public selectedEveryX: any = '4';
  distanceToPrevInputBox: number = this.selectedEveryX;

  correctCount: number = 0;
  totalCount: number = 0;

  public checkedVPos: any;
  public excludeFirstSentence = true;
  public excludeLastSentence = true;
  public sentences: any;
  lastIndex = 0;

  renderedData: any;

  userInput: string[] = [];

  public correctAnswer: string[] = [];
  public wrongAnswer: string[] = [];
  public isCorrect: boolean[] = [];

  public isAnswerChecked: boolean[] = [];

  AreAnswersChecked: boolean = false;
  private answersShown = false;

  public showItems = true;
  public showListItems = false;

  navigate(page: string) {
    if (this.validPages.includes(page)) {
      this.currentPage = page;
    } else {
      this.snack.open("Invalid page!", "OK", { duration: 5000 });
    }
  }

  checkScreenSize(): void {
    this.bigScreen = window.innerWidth > 768;
    window.addEventListener("resize", event => {
      this.bigScreen = window.innerWidth > 768;
    });
  }


  ngOnInit() {
    this.checkScreenSize();
    this.route.queryParams.subscribe({
      next: params => {
        const encodedId = params['id'];
        const id = decodeURIComponent(encodedId);
        if (id === 'undefined') {
          this.currentPageNumber = 0;
        } else {
          this.backend.showData(id).subscribe({
            next: response => {
              const data = response;
              this.selectedLanguage = data['selectedLanguage'];
              this.lessonNumber = data['lessonNumber'];
              this.lessonTitle = data['lessonTitle'];
              this.posData = data['posData'];
              this.renderedData = data['renderedData']
              this.onlyShowExercise = data['onlyShowExercise'];
              if (this.lessonNumber && this.lessonTitle && this.posData && this.renderedData && this.onlyShowExercise) {
                this.currentPageNumber = 3;
                this.ls.setLanguage(this.selectedLanguage);
              }
            },
            error: error => {
              this.snack.open("Lesson not found", "OK", { duration: 5000 });
            }
          });
        }
      },
      error: error => {
        console.error(error);
      }
    });
    console.log(this.selectedLanguage)
    this.loadLessons();
  }


  updateUrl(): void {
    const data = {
      lessonNumber: this.lessonNumber,
      lessonTitle: this.lessonTitle,
      posData: this.posData,
      renderedData: this.renderedData,
      showItems: this.showItems,
      onlyShowExercise: true,
      selectedLanguage: this.selectedLanguage

    };
    this.backend.storeData(data).subscribe(response => {
      const id = response.id;
      const data = response.data;
      const encodedId = encodeURIComponent(id);
      const encodedLn = encodeURIComponent(data['lessonNumber'])
      const encodedLt = encodeURIComponent(data['lessonTitle'])
      const encodedLang = encodeURIComponent(data['selectedLanguage'])
      //this.generatedUrl = https://spraakbanken.gu.se/larkalabb/sfs/xgen?id=${encodedId}&lessonNumber=${encodedLn}&lessonTitle=${encodedLt}&selectedLanguage=${encodedLang}`;
      this.generatedUrl = `http://localhost:4200/xgen?id=${encodedId}&lessonNumber=${encodedLn}&lessonTitle=${encodedLt}&selectedLanguage=${encodedLang}`;
    });
  }


  copyToClipboard(): void {
    this.clipboard.copy(this.generatedUrl);
  }


  public toggleList() {
    this.showListItems = !this.showListItems;
  }


  clearForm() {
    this.lessonNumber = '';
    this.lessonTitle = '';
    this.textareaValue = '';
    this.isChecked = {};
    this.posData = '';
    console.log(this.posData.altAnswer)
    if (this.posData.altAnswer) {
      this.posData.altAnswer = [];
    }
  }


  loadLessons() {
    this.validLessons = [];
    for (let i = 1; i <= 25; i++) {
      const lessonNumber = i.toString();

      this.http.get(`./assets/lessons/lesson${lessonNumber}.txt`, { responseType: 'text' }).subscribe((data: string) => {
        const lines = data.split('\n');
        const title = lines[0].substring(3);
        const textareaValue = lines.slice(1).join('\n');
        const lesson: Lesson = { lessonNumber, title, textareaValue };
        this.validLessons.push(lesson);
      });
    }
  }


  reviewManualExercise() {
    const selectedLesson = this.validLessons.find(lesson => lesson.lessonNumber === this.manualLesson);
    if (selectedLesson) {
      this.lessonNumber = selectedLesson.lessonNumber;
      this.lessonTitle = selectedLesson.title;
      this.textareaValue = selectedLesson.textareaValue;
    }
  }


  process(ln: string, title: string, text: string) {
    if (!ln || !title || !text) {
      this.snack.open("Please fill out all fields!", "OK", { duration: 5000 });
      return;
    }

    this.lessonNumber = ln;
    this.lessonTitle = title;

    this.waiter.on();

    this.backend.process(text).subscribe({
      next: (v) => {
        this.posData = v;

        this.posData.forEach((item: any) => {
          item.accept = item.text;
        });

        this.waiter.off();
        this.processedText = true;
        this.next()
      },
      error: (error) => {
        this.snack.open("Something went wrong!", "OK", { duration: 5000 });
      }
    });
  }


  next() {
    this.currentPageNumber++;
  }


  back() {
    this.currentPageNumber--;
    this.correctCount = 0;
    if (this.userInput) {
      this.userInput = [];
    }
  }


  discard() {
    this.posData = "";
    this.processedText = false;
    this.disabledNumbers = [];
  }


  insertLinebreak(i: number) {
    if (!this.disabledNumbers.includes(i)) {
      this.posData.splice(i + 1, 0, { "lemma": "<br/><br/>", "pos": "LINEBREAK", "text": "<br/><br/>", "sent_id": -1, "max_sent_id": 0 });
      this.disabledNumbers.push(i);
    } else {
      this.posData.splice(i + 1, 1);
      this.disabledNumbers.splice(this.disabledNumbers.indexOf(i), 1);
    }
  }


  getIsDisabled(i: number) {
    if (this.disabledNumbers.includes(i)) {
      return true;
    }
    return false;
  }


  deleteWord(i: number) {
    this.posData.splice(i, 1);
  }


  togglePos() {
    this.showValidPos = !this.showValidPos;
  }


  preview() {
    this.currentPageNumber++;
    console.log(this.altAnswer);
    this.sentences = this.textareaValue.split('.').filter(sentence => sentence.trim() !== '');

    this.checkedVPos = Object.keys(this.isChecked).filter(vPos => this.isChecked[vPos]);
    this.waiter.on();

    // find what items should be made into gaps
    this.backend.process3(this.posData, this.checkedVPos, parseInt(this.selectedEveryX),
      this.excludeFirstSentence, this.excludeLastSentence).subscribe({
        next: (v) => {
          this.renderedData = v;
        }
      });
    this.waiter.off();
  }

  checkAnswers() {
    this.correctCount = 0;
    this.totalCount = this.renderedData.length;
    for (let i = 0; i < this.posData.length; i++) {
      const word = this.posData[i];
      const input = this.userInput[i];
      if (input && (input === word.accept || (word.altAnswer && word.altAnswer.includes(input)))) {
        this.correctAnswer.push(input);
        this.isCorrect[i] = true;
        this.isAnswerChecked[i] = true;
        this.correctCount++;
      } else if (input !== undefined) {
        this.wrongAnswer.push(input);
        this.isAnswerChecked[i] = true;
        this.isCorrect[i] = false;
      }
    }
    console.log(this.correctCount, this.totalCount)
  }


  showAnswers() {
    this.isAnswerChecked = [];
    const gaps = this.elem.nativeElement.querySelectorAll('.gap');
    if (this.answersShown) {
      // hide the answers
      for (let i = 0; i < gaps.length; i++) {
        const gapElement = gaps[i] as HTMLInputElement | null;
        if (gapElement) {
          const id = parseInt(gapElement.id.split('-')[1]);
          if (this.userInput[id]) {
            gapElement.value = this.userInput[id];
          } else {
            gapElement.value = ''; // set empty value if userInput is not defined
          }
          gapElement.classList.remove('correct', 'wrong');
          gapElement.classList.add('white-gap');
        }
      }
    } else {
      // show the answers
      for (let i = 0; i < gaps.length; i++) {
        const gapElement = gaps[i] as HTMLInputElement | null;
        if (gapElement) {
          const index = parseInt(gapElement.id.split('-')[1], 10);
          const word = this.posData[index];
          gapElement.value = word.accept.split(',')[0];
          gapElement.classList.remove('wrong', 'white-gap');
          gapElement.classList.add('correct');
        }
      }
    }
    this.answersShown = !this.answersShown;
  }


  debug() {
    this.backend.process2(this.posData, true, true, 4).subscribe({
      next: (v) => {
        console.log(v);
      },
      error: (msg) => { },
      complete: () => { }
    })
  }


}
