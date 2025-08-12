import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServerNode } from './server-node';

describe('ServerNode', () => {
  let component: ServerNode;
  let fixture: ComponentFixture<ServerNode>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServerNode]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServerNode);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
