import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-server-node',
  imports: [],
  templateUrl: './server-node.html',
  styleUrl: './server-node.scss'
})
export class ServerNode {
  @Input() name : String = "default";
}
