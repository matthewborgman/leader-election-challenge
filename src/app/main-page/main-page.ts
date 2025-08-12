import { Component } from '@angular/core';
import { ServerNode } from '../server-node/server-node';

@Component({
  selector: 'app-main-page',
  imports: [ServerNode],
  templateUrl: './main-page.html',
  styleUrl: './main-page.scss'
})
export class MainPage {

  nodes: String[] = ["one", "two", "three"]
}
