import { Component } from '@angular/core';
import { ServerNode } from '../server-node/server-node';

@Component({
  selector: 'app-main-page',
  imports: [ServerNode],
  templateUrl: './main-page.html',
  styleUrl: './main-page.scss'
})
export class MainPage {

  nodes: string[] = []

  private nodeNames: string[] = [
    'Alfa',
    'Bravo',
    'Charlie',
    'Delta',
    'Echo',
    'Foxtrot',
    'Golf',
    'Hotel',
    'India',
    'Juliett',
    'Kilo',
    'Lima',
    'Mike',
    'November',
    'Oscar',
    'Papa',
    'Quebec',
    'Romeo',
    'Sierra',
    'Tango',
    'Uniform',
    'Victor',
    'Whiskey',
    'Xray',
    'Yankee',
    'Zulu'
  ].reverse();

  addNode() {
    const newNode = this.nodeNames.pop();
    if (newNode) {
      this.nodes.push(newNode);
    }
  }
}
