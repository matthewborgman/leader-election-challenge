import { Component, Inject, Input } from '@angular/core';
import { Network } from '../network';

@Component({
  selector: 'app-server-node',
  imports: [],
  templateUrl: './server-node.html',
  styleUrl: './server-node.scss'
})
export class ServerNode {
  @Input() name : string = "default";

  constructor(@Inject(Network) private network: Network) {
    this.network.join(this.name, this);
  }


}
